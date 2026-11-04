pub mod model;
use model::*;
use near_sdk::{near,env,require,AccountId,PanicOnDefault,collections::UnorderedMap,serde::{Serialize,Deserialize},serde_json::json};
use std::collections::BTreeMap;
const WINDOW:u64=15_000;
const MATCH_STORAGE:u128=500_000_000_000_000_000_000_000; // 0.5 test NEAR; covers bounded 20-round history.
#[derive(Clone,near_sdk::borsh::BorshSerialize,near_sdk::borsh::BorshDeserialize)]
pub struct Room {game:Game,accounts:BTreeMap<String,AccountId>,ready:BTreeMap<String,bool>,pending:BTreeMap<String,Order>,deadline:Option<u64>,started:bool,archive_votes:BTreeMap<String,bool>}
#[derive(Serialize,Deserialize)]
#[serde(crate="near_sdk::serde")]
pub struct Player {ready:bool,connected:bool}
#[derive(Serialize,Deserialize)]
#[serde(crate="near_sdk::serde")]
pub struct Snapshot {code:String,game:Game,pending:BTreeMap<String,Order>,deadline:Option<u64>,#[serde(rename="serverNow")]server_now:u64,started:bool,players:BTreeMap<String,Player>,accounts:BTreeMap<String,AccountId>,settlement:String}
#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {rooms:UnorderedMap<String,Room>,next_id:u32}
#[near]
impl Contract {
 #[init]
 pub fn new()->Self{Self{rooms:UnorderedMap::new(b"r"),next_id:0}}
 pub fn version(&self)->near_sdk::serde_json::Value{json!({"version":"0.2.0","rules_version":1,"network":"testnet","round_ms":WINDOW,"create_deposit":MATCH_STORAGE.to_string(),"max_matches":100,"credits":"match-scoped, non-transferable game units"})}
 #[payable]
 pub fn create_match(&mut self,identity:Identity)->String{
  require!(env::attached_deposit().as_yoctonear()>=MATCH_STORAGE,"Attach 0.5 test NEAR for bounded match storage");
  require!(self.rooms.len()<100,"Match limit reached; archive a finished match first");
  self.next_id+=1;let id=format!("{:06X}",self.next_id);let mut game=create(&id);game.identities.insert("A".into(),model::identity(&identity.name,&identity.portrait,"A"));
  let accounts=BTreeMap::from([("A".into(),env::predecessor_account_id())]);let room=Room{game,accounts,ready:BTreeMap::from([("A".into(),false)]),pending:BTreeMap::new(),deadline:None,started:false,archive_votes:BTreeMap::new()};self.rooms.insert(&id,&room);
  env::log_str(&format!("EVENT_JSON:{}",json!({"standard":"last_light","version":"1.0.0","event":"match_created","data":[{"match_id":id}]})));id
 }
 pub fn join_match(&mut self,match_id:String,identity:Identity)->String{
  let mut room=self.room(&match_id);let caller=env::predecessor_account_id();
  if let Some((seat,_))=room.accounts.iter().find(|(_,a)|**a==caller){return seat.clone();}
  require!(!room.started,"This match has already started");require!(!room.accounts.contains_key("B"),"Both merchant seats are occupied");
  room.accounts.insert("B".into(),caller);room.ready.insert("B".into(),false);room.game.identities.insert("B".into(),model::identity(&identity.name,&identity.portrait,"B"));self.rooms.insert(&match_id,&room);"B".into()
 }
 pub fn ready_match(&mut self,match_id:String){let mut room=self.room(&match_id);let seat=Self::seat(&room);require!(!room.started,"Match already started");room.ready.insert(seat,true);if room.ready.get("A")==Some(&true)&&room.ready.get("B")==Some(&true){room.started=true;room.deadline=Some(Self::now()+WINDOW);}self.rooms.insert(&match_id,&room);}
 pub fn submit_order(&mut self,match_id:String,round:u16,order:Order){
  let mut room=self.room(&match_id);let seat=Self::seat(&room);require!(room.started&&room.game.status=="playing","Match is not accepting orders");require!(round==room.game.round&&Self::now()<room.deadline.unwrap(),"Order is stale or late; it was not carried forward");
  let order=order.normalized().unwrap_or_else(|e|env::panic_str(&e));room.pending.insert(seat.clone(),order);self.rooms.insert(&match_id,&room);
  env::log_str(&format!("EVENT_JSON:{}",json!({"standard":"last_light","version":"1.0.0","event":"order_included","data":[{"match_id":match_id,"round":round,"seat":seat}]})));
 }
 pub fn settle_round(&mut self,match_id:String,round:u16)->Snapshot{
  let mut room=self.room(&match_id);
  if round<=room.game.settled_round{return Self::snapshot(room);}
  require!(room.started&&room.game.status=="playing"&&round==room.game.round,"Round is stale or match is terminal");require!(Self::now()>=room.deadline.unwrap(),"Decision window is still open");
  let mut orders=room.pending.clone();orders.insert("NPC".into(),npc(&room.game,&orders));settle(&mut room.game,orders);room.pending.clear();room.deadline=if room.game.status=="playing"{Some(Self::now()+WINDOW)}else{None};self.rooms.insert(&match_id,&room);
  env::log_str(&format!("EVENT_JSON:{}",json!({"standard":"last_light","version":"1.0.0","event":"round_settled","data":[{"match_id":match_id,"round":round,"status":room.game.status}]})));Self::snapshot(room)
 }
 pub fn get_match(&self,match_id:String)->Snapshot{Self::snapshot(self.room(&match_id))}
 pub fn list_matches(&self,from_index:Option<u64>,limit:Option<u64>)->Vec<near_sdk::serde_json::Value>{self.rooms.iter().skip(from_index.unwrap_or(0)as usize).take(limit.unwrap_or(20).min(50)as usize).map(|(id,r)|json!({"match_id":id,"accounts":r.accounts,"round":r.game.round,"status":r.game.status,"started":r.started})).collect()}
 // Both owners must consent before deleting a finished match. Export before voting.
 pub fn archive_match(&mut self,match_id:String)->bool{let mut room=self.room(&match_id);let seat=Self::seat(&room);require!(room.game.status!="playing","Only finished matches may be archived");room.archive_votes.insert(seat,true);if room.archive_votes.len()==2{self.rooms.remove(&match_id);true}else{self.rooms.insert(&match_id,&room);false}}
}
impl Contract {
 fn now()->u64{env::block_timestamp()/1_000_000}
 fn room(&self,id:&str)->Room{self.rooms.get(&id.to_string()).unwrap_or_else(||env::panic_str("Match not found"))}
 fn seat(room:&Room)->String{room.accounts.iter().find(|(_,a)|**a==env::predecessor_account_id()).map(|(s,_)|s.clone()).unwrap_or_else(||env::panic_str("This wallet does not own a merchant in this match"))}
 fn snapshot(room:Room)->Snapshot{Snapshot{code:room.game.id.clone(),game:room.game,pending:room.pending,deadline:room.deadline,server_now:Self::now(),started:room.started,players:room.accounts.keys().map(|s|(s.clone(),Player{ready:*room.ready.get(s).unwrap_or(&false),connected:true})).collect(),accounts:room.accounts,settlement:"near-testnet".into()}}
}
