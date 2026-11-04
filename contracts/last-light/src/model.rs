use near_sdk::{borsh::{BorshDeserialize,BorshSerialize}, serde::{Serialize,Deserialize}};
use std::collections::BTreeMap;
pub const SEATS:[&str;3]=["A","B","NPC"];
macro_rules! model {($name:ident {$($f:ident:$t:ty),* $(,)?})=>{
 #[derive(Clone,Debug,Serialize,Deserialize,BorshSerialize,BorshDeserialize)]
 #[serde(crate="near_sdk::serde")]
 pub struct $name {$(pub $f:$t),*}
};}
model!(Identity {name:String,portrait:String});
model!(Goods {oxygen:u16,medicine:u16,fuel:u16});
impl Goods {pub fn get(&self,g:&str)->u16{match g{"oxygen"=>self.oxygen,"medicine"=>self.medicine,_=>self.fuel}} pub fn add(&mut self,g:&str,n:i32){let x=match g{"oxygen"=>&mut self.oxygen,"medicine"=>&mut self.medicine,_=>&mut self.fuel};*x=(*x as i32+n) as u16;}}
model!(Merchant {cash:u16,tank:u16,location:String,cargo:Goods});
model!(Colony {oxygen:u16,medicine:u16,health:u16,treasury:u16,quota:u16,medicine_bought:u16,plant_fuel_used:u16,critical:bool});
#[derive(Clone,Debug,Serialize,Deserialize,BorshSerialize,BorshDeserialize,Default)]
#[serde(crate="near_sdk::serde",deny_unknown_fields)]
pub struct Order {
 pub kind:String,
 #[serde(skip_serializing_if="Option::is_none")]pub good:Option<String>,
 #[serde(skip_serializing_if="Option::is_none")]pub amount:Option<u16>,
 #[serde(skip_serializing_if="Option::is_none")]pub refill:Option<u16>,
 #[serde(skip_serializing_if="Option::is_none")]pub destination:Option<String>,
 #[serde(skip_serializing_if="Option::is_none")]pub minimum_total:Option<u16>,
 #[serde(skip_serializing_if="Option::is_none")]pub unit_price:Option<u16>,
 #[serde(skip_serializing_if="Option::is_none")]pub seller:Option<String>,
 #[serde(skip_serializing_if="Option::is_none")]pub offer_version:Option<u16>,
}
impl Order {
 pub fn wait()->Self{Self{kind:"wait".into(),..Self::default()}}
 pub fn load(g:&str,n:u16,f:u16)->Self{Self{kind:"load".into(),good:Some(g.into()),amount:Some(n),refill:Some(f),..Self::default()}}
 pub fn travel(d:&str)->Self{Self{kind:"travel".into(),destination:Some(d.into()),..Self::default()}}
 pub fn sell(g:&str,n:u16)->Self{Self{kind:"sell".into(),good:Some(g.into()),amount:Some(n),..Self::default()}}
 pub fn normalized(self)->Result<Self,String>{
  if !["wait","load","travel","sell","list","buy","cancel"].contains(&self.kind.as_str())||[self.amount,self.refill,self.minimum_total].iter().flatten().any(|v|*v>1000){return Err("Use valid actions and whole quantities from 0 to 1000".into());}
  match self.kind.as_str(){
   "list"|"buy"=>{let g=self.good.as_deref().unwrap_or("");let n=self.amount.unwrap_or(0);let price=self.unit_price.unwrap_or(0);if !["oxygen","medicine","fuel"].contains(&g)||n<1||n>6||price<1||price>25{return Err("Choose a whole lot and a unit price from 1 to 25".into());}let mut o=Self{kind:self.kind.clone(),good:Some(g.into()),amount:Some(n),unit_price:Some(price),..Self::default()};if self.kind=="buy"{let seller=self.seller.as_deref().unwrap_or("");let version=self.offer_version.unwrap_or(0);if !SEATS.contains(&seller)||version<1||version>1000{return Err("Choose an existing offer and its version".into());}o.seller=Some(seller.into());o.offer_version=Some(version);o.refill=Some(self.refill.unwrap_or(0));}Ok(o)},
   "cancel"=>Ok(Self{kind:"cancel".into(),..Self::default()}),
   "load"|"sell"=>{let g=self.good.as_deref().unwrap_or("");if !["oxygen","medicine","fuel"].contains(&g){return Err("Unknown cargo".into());}let mut o=if self.kind=="load"{Self::load(g,self.amount.unwrap_or(0),self.refill.unwrap_or(0))}else{Self::sell(g,self.amount.unwrap_or(0))};if self.kind=="sell"{o.minimum_total=Some(self.minimum_total.unwrap_or(0));}Ok(o)},
   "travel"=>{let d=self.destination.as_deref().unwrap_or("");if !["depot","habitat","clinic"].contains(&d){return Err("Unknown destination".into());}Ok(Self::travel(d))},_=>Ok(Self::wait())
  }
 }
}
#[derive(Clone,Debug,Serialize,Deserialize,BorshSerialize,BorshDeserialize)]
#[serde(crate="near_sdk::serde")]
pub struct Receipt {pub accepted:bool,pub reason:String,#[serde(skip_serializing_if="Option::is_none")]pub filled:Option<u16>,#[serde(skip_serializing_if="Option::is_none")]pub payout:Option<u16>,#[serde(skip_serializing_if="Option::is_none")]pub cost:Option<u16>}
fn reject(s:&str)->Receipt{Receipt{accepted:false,reason:s.into(),filled:Some(0),payout:Some(0),cost:Some(0)}}
fn accept(s:&str)->Receipt{Receipt{accepted:true,reason:s.into(),filled:Some(0),payout:Some(0),cost:Some(0)}}
model!(Offer {seller:String,version:u16,good:String,amount:u16,unit_price:u16,created_round:u16});
model!(Trade {round:u16,seller:String,buyer:String,good:String,amount:u16,unit_price:u16,total:u16});
model!(Market {offers:BTreeMap<String,Offer>,versions:BTreeMap<String,u16>,trades:Vec<Trade>});
model!(MarketRecord {offers:BTreeMap<String,Offer>,trades:Vec<Trade>});
#[derive(Clone,Debug,Serialize,Deserialize,BorshSerialize,BorshDeserialize)]
#[serde(crate="near_sdk::serde")]
pub struct Record {pub round:u16,pub priority:Vec<String>,pub orders:BTreeMap<String,Order>,pub receipts:BTreeMap<String,Receipt>,pub colony:Colony,pub merchants:BTreeMap<String,Merchant>,pub status:String,#[serde(default,skip_serializing_if="Option::is_none")]pub market:Option<MarketRecord>}
#[derive(Clone,Debug,Serialize,Deserialize,BorshSerialize,BorshDeserialize)]
#[serde(crate="near_sdk::serde")]
pub struct Game {
 pub version:u16,pub id:String,pub round:u16,#[serde(rename="settledRound")]pub settled_round:u16,pub status:String,pub cause:Option<String>,pub identities:BTreeMap<String,Identity>,pub merchants:BTreeMap<String,Merchant>,pub depot:Goods,pub colony:Colony,pub depot_revenue:u16,pub fuel_burned:u16,pub oxygen_consumed:u16,pub medicine_consumed:u16,pub history:Vec<Record>,#[serde(default,skip_serializing_if="Option::is_none")]pub market:Option<Market>
}
pub fn identity(name:&str,portrait:&str,seat:&str)->Identity{
 let fallback=if seat=="B"{"Ilan Rook"}else if seat=="NPC"{"Tess Calder"}else{"Mara Vale"};
 let name:String=name.chars().filter(|c|!c.is_control()&&*c!='<'&&*c!='>').collect::<String>().split_whitespace().collect::<Vec<_>>().join(" ").chars().take(24).collect();
 Identity{name:if name.is_empty(){fallback.into()}else{name},portrait:if seat=="NPC"{"tess".into()}else if ["mara","ilan"].contains(&portrait){portrait.into()}else if seat=="B"{"ilan".into()}else{"mara".into()}}
}
pub fn create(id:&str)->Game{Game{version:1,id:id.into(),round:1,settled_round:0,status:"playing".into(),cause:None,
 identities:SEATS.iter().map(|s|(s.to_string(),identity("","",s))).collect(),
 merchants:SEATS.iter().map(|s|(s.to_string(),Merchant{cash:25,tank:0,location:"depot".into(),cargo:Goods{oxygen:0,medicine:0,fuel:0}})).collect(),
 depot:Goods{oxygen:3,medicine:4,fuel:24},colony:Colony{oxygen:4,medicine:1,health:2,treasury:180,quota:18,medicine_bought:0,plant_fuel_used:0,critical:false},depot_revenue:0,fuel_burned:0,oxygen_consumed:0,medicine_consumed:0,history:vec![],market:None}}
pub fn enable_market(s:&mut Game){s.version=2;s.market=Some(Market{offers:BTreeMap::new(),versions:SEATS.iter().map(|s|(s.to_string(),0)).collect(),trades:vec![]});}
pub fn volume(p:&Merchant)->u16{p.cargo.oxygen*2+p.cargo.medicine+p.cargo.fuel}
pub fn priority(r:u16)->Vec<String>{let first=((r-1)/3+(r-1)%3)%3;(0..3).map(|i|SEATS[((first+i)%3)as usize].into()).collect()}
fn execute_market(s:&mut Game,seat:&str,o:&Order)->Receipt{
 if s.market.is_none(){return reject("Merchant trading is not enabled in this match");}
 let p=&s.merchants[seat];if p.location!="depot"{return reject("Merchant trading is available only at the depot");}
 if o.kind=="cancel"{let market=s.market.as_mut().unwrap();if market.offers.remove(seat).is_none(){return reject("No offer to cancel");}return accept("Offer cancelled");}
 let g=o.good.as_deref().unwrap();let amount=o.amount.unwrap();let price=o.unit_price.unwrap();
 if o.kind=="list"{if p.cargo.get(g)<amount{return reject("Not enough owned cargo for this lot");}let market=s.market.as_mut().unwrap();let version=market.versions.get_mut(seat).unwrap();*version+=1;market.offers.insert(seat.into(),Offer{seller:seat.into(),version:*version,good:g.into(),amount,unit_price:price,created_round:s.round});return accept("Offer listed; cargo stays yours and occupies your hold");}
 let seller=o.seller.as_deref().unwrap();if seller==seat{return reject("You cannot buy your own offer");}
 let offer=s.market.as_ref().unwrap().offers.get(seller);
 if offer.is_none(){return reject("Offer changed or was withdrawn; nothing transferred");}let offer=offer.unwrap();
 if offer.version!=o.offer_version.unwrap()||offer.good!=g||offer.amount!=amount||offer.unit_price!=price{return reject("Offer changed or was withdrawn; nothing transferred");}
 if offer.created_round>=s.round{return reject("An offer can be bought only from a later round");}
 let vendor=&s.merchants[seller];if vendor.location!="depot"||vendor.cargo.get(g)<amount{return reject("Seller or cargo is no longer available");}
 let refill=o.refill.unwrap_or(0);if volume(p)+amount*if g=="oxygen"{2}else{1}>6||p.tank+refill>2||(g=="oxygen"&&p.cargo.oxygen+amount>3){return reject("Cargo or tank capacity exceeded");}
 if s.depot.fuel<refill{return reject("Not enough depot stock for the tank refill");}let total=amount*price;let cost=total+refill;if p.cash<cost{return reject("Not enough credits for the lot and refill");}
 {let p=s.merchants.get_mut(seat).unwrap();p.cash-=cost;p.cargo.add(g,amount as i32);p.tank+=refill;}{let vendor=s.merchants.get_mut(seller).unwrap();vendor.cash+=total;vendor.cargo.add(g,-(amount as i32));}
 s.depot.fuel-=refill;s.depot_revenue+=refill;let market=s.market.as_mut().unwrap();market.offers.remove(seller);market.trades.push(Trade{round:s.round,seller:seller.into(),buyer:seat.into(),good:g.into(),amount,unit_price:price,total});let mut receipt=accept("Merchant trade settled");receipt.filled=Some(amount);receipt.cost=Some(cost);receipt
}
fn resale_estimate(s:&Game,g:&str,n:u16)->u16{let c=&s.colony;if g=="fuel"{let fill=n.min(3-c.plant_fuel_used).min(c.quota/2).min((7-c.oxygen.saturating_sub(2))/2);return if fill==n{fill*4}else{0};}let stock=if g=="oxygen"{c.oxygen.saturating_sub(2)}else{c.medicine};let fill=n.min(if g=="oxygen"{7}else{2}-stock).min(if g=="oxygen"{c.quota}else{3-c.medicine_bought});(0..fill).map(|i|if g=="oxygen"{8u16.saturating_sub(stock+i).max(4)}else if stock+i==0{8}else{5}).sum()}
fn market_npc(s:&Game)->Option<Order>{
 let m=s.market.as_ref()?;let p=&s.merchants["NPC"];let c=&s.colony;if p.location!="depot"{return None;}
 if let Some(o)=m.offers.get("NPC"){if s.round.saturating_sub(o.created_round)<2&&c.oxygen>2{return Some(Order::wait());}if p.tank<2{return Some(Order::load(&o.good,0,2-p.tank));}return Some(Order::travel(if o.good=="medicine"{"clinic"}else{"habitat"}));}
 let mut offers:Vec<&Offer>=m.offers.values().filter(|o|o.seller!="NPC"&&o.created_round<s.round).collect();offers.sort_by(|a,b|(a.amount*a.unit_price).cmp(&(b.amount*b.unit_price)).then(a.seller.cmp(&b.seller)));
 for o in offers{let margin=resale_estimate(s,&o.good,o.amount)as i32-(o.amount*o.unit_price)as i32-2;if margin<2||p.cash<o.amount*o.unit_price+2-p.tank||volume(p)+o.amount*if o.good=="oxygen"{2}else{1}>6||(o.good=="oxygen"&&p.cargo.oxygen+o.amount>3){continue;}if (o.good=="oxygen"||o.good=="fuel")&&c.quota==0{continue;}return Some(Order{kind:"buy".into(),seller:Some(o.seller.clone()),offer_version:Some(o.version),good:Some(o.good.clone()),amount:Some(o.amount),unit_price:Some(o.unit_price),refill:Some(2-p.tank),..Order::default()});}
 let g=["oxygen","medicine","fuel"].iter().find(|g|p.cargo.get(g)>0)?;let next=[6,12,18].into_iter().find(|r|*r>=s.round);let slack=if *g=="medicine"{c.medicine>0&&(next.is_none()||next.unwrap()-s.round>=4)}else{c.oxygen>=5};let n=p.cargo.get(g);let estimated=(resale_estimate(s,g,n)as i32-4)/(n as i32);let price=estimated.min(if *g=="fuel"{2}else{3});
 if slack&&price>=1&&s.round<=15&&["A","B"].iter().any(|seat|{let buyer=&s.merchants[*seat];buyer.location=="depot"&&volume(buyer)+n*if *g=="oxygen"{2}else{1}<=6&&buyer.cash>=n*price as u16+2-buyer.tank}){return Some(Order{kind:"list".into(),good:Some((*g).into()),amount:Some(n),unit_price:Some(price as u16),..Order::default()});}None
}
pub fn execute(s:&mut Game,seat:&str,input:&Order)->Receipt{
 let o=match input.clone().normalized(){Ok(o)=>o,Err(e)=>return reject(&e)};
 if ["list","buy","cancel"].contains(&o.kind.as_str()){return execute_market(s,seat,&o);}
 let p=s.merchants.get_mut(seat).unwrap();let c=&mut s.colony;
 let g=o.good.as_deref().unwrap_or("");let n=o.amount.unwrap_or(0);let f=o.refill.unwrap_or(0);
 match o.kind.as_str(){
 "wait"=>accept("Waited"),
 "load"=>{
  if p.location!="depot"{return reject("Loading is available only at the depot");}
  if n==0&&f==0{return reject("Choose cargo or a tank refill");}
  if p.tank+f>2||volume(p)+n*if g=="oxygen"{2}else{1}>6{return reject("Cargo or tank capacity exceeded");}
  if g=="oxygen"&&p.cargo.oxygen+n>3{return reject("At most three oxygen per merchant");}
  if s.depot.get(g)<n||s.depot.fuel<f+if g=="fuel"{n}else{0}{return reject("Not enough depot stock");}
  let cost=n*if g=="fuel"{1}else{2}+f;if p.cash<cost{return reject("Not enough credits");}
  p.cash-=cost;s.depot_revenue+=cost;s.depot.add(g,-(n as i32));s.depot.fuel-=f;p.cargo.add(g,n as i32);p.tank+=f;
  let mut r=accept("Loaded");r.filled=Some(n);r.cost=Some(cost);r
 },
 "travel"=>{let d=o.destination.unwrap();let valid=if p.location=="depot"{d=="habitat"||d=="clinic"}else{d=="depot"};if !valid{return reject("Travel must go through the depot");}if p.tank<if p.location=="depot"{2}else{1}{return reject("Not enough fuel for the trip and return");}if let Some(m)=s.market.as_mut(){m.offers.remove(seat);}p.location=d;p.tank-=1;s.fuel_burned+=1;accept("Travelled")},
 "sell"=>{
  if p.location!=if g=="medicine"{"clinic"}else{"habitat"}{return reject("Cargo must be sold at its district");}
  if n<1||p.cargo.get(g)<1{return reject("No selected cargo to sell");}
  let (fill,payout)=if g=="fuel"{
   if n>p.cargo.fuel||n>3-c.plant_fuel_used||n*2>c.quota||c.oxygen+n*2>7{return reject("Plant conversion must fill entirely within storage, quota and lifetime cap");}(n,n*4)
  }else{let room=if g=="oxygen"{7-c.oxygen}else{2-c.medicine};let cap=if g=="oxygen"{c.quota}else{3-c.medicine_bought};let fill=n.min(p.cargo.get(g)).min(room).min(cap);let payout=(0..fill).map(|i|if g=="oxygen"{8u16.saturating_sub(c.oxygen+i).max(4)}else if c.medicine+i==0{8}else{5}).sum();(fill,payout)};
  if fill<1{return reject("No district storage or procurement quota remains");}if payout<o.minimum_total.unwrap_or(0){return reject("Payout fell below your minimum; cargo retained");}if payout>c.treasury{return reject("Treasury cannot cover the delivery");}
  p.cargo.add(g,-(fill as i32));p.cash+=payout;c.treasury-=payout;
  match g{"fuel"=>{c.oxygen+=fill*2;c.quota-=fill*2;c.plant_fuel_used+=fill;},"oxygen"=>{c.oxygen+=fill;c.quota-=fill;},_=>{c.medicine+=fill;c.medicine_bought+=fill;}}
  let mut r=accept("Sold");r.filled=Some(fill);r.payout=Some(payout);r
 },_=>reject("Unknown action")}
}
pub fn npc(s:&Game,pending:&BTreeMap<String,Order>)->Order{
 if let Some(order)=market_npc(s){if execute(&mut s.clone(),"NPC",&order).accepted{return order;}}
 let p=&s.merchants["NPC"];let c=&s.colony;
 if p.location!="depot"{let g=if p.location=="clinic"{"medicine"}else if p.cargo.oxygen>0{"oxygen"}else{"fuel"};return if p.cargo.get(g)>0{Order::sell(g,p.cargo.get(g))}else{Order::travel("depot")};}
 for g in ["oxygen","medicine","fuel"]{if p.cargo.get(g)>0{return Order::travel(if g=="medicine"{"clinic"}else{"habitat"});}}
 let reserved:u16=pending.iter().filter(|(k,o)|k.as_str()!="NPC"&&o.kind=="load"&&o.good.as_deref()==Some("oxygen")).map(|(_,o)|o.amount.unwrap_or(0)).sum();
 let available=s.depot.oxygen.saturating_sub(reserved);
 if s.round>1&&c.oxygen<=4&&available>0{let o=Order::load("oxygen",available.min(3),2-p.tank);if execute(&mut s.clone(),"NPC",&o).accepted{return o;}}
 if c.medicine==0&&c.medicine_bought<3{let o=Order::load("medicine",1,2-p.tank);if execute(&mut s.clone(),"NPC",&o).accepted{return o;}}
 Order::wait()
}
pub fn settle(s:&mut Game,mut orders:BTreeMap<String,Order>){
 let r=s.round;orders.entry("NPC".into()).or_insert_with(||npc(s,&BTreeMap::new()));
 for seat in SEATS{orders.entry(seat.into()).or_insert_with(Order::wait);}
 let mut receipts=BTreeMap::new();for seat in priority(r){receipts.insert(seat.clone(),execute(s,&seat,&orders[&seat]));}
 let c=&mut s.colony;let was_critical=c.critical;let had_oxygen=c.oxygen>0;
 if had_oxygen{c.oxygen-=1;s.oxygen_consumed+=1;}if [6,12,18].contains(&r){if c.medicine>0{c.medicine-=1;s.medicine_consumed+=1;}else{c.health-=1;}}
 if was_critical&&!had_oxygen{s.status="collapsed".into();s.cause=Some("The final oxygen rescue window closed without a delivery.".into());}
 if c.health==0{s.status="collapsed".into();s.cause=Some("The clinic missed two medicine deadlines.".into());}
 c.critical=c.oxygen==0;s.settled_round=r;
 if r==20&&s.status=="playing"{if c.oxygen>=2&&c.medicine>=1&&c.health>=1{s.status="survived".into();}else{s.status="collapsed".into();s.cause=Some("The colony reached round 20 without the required oxygen and medicine reserves.".into());}}
 if s.status!="playing"{if let Some(m)=s.market.as_mut(){m.offers.clear();}}
 let market=s.market.as_ref().map(|m|MarketRecord{offers:m.offers.clone(),trades:m.trades.iter().filter(|t|t.round==r).cloned().collect()});
 s.history.push(Record{round:r,priority:priority(r),orders,receipts,colony:c.clone(),merchants:s.merchants.clone(),status:s.status.clone(),market});
 if s.status=="playing"{s.round=r+1;if [1,4,7,10,13,16].contains(&s.round){s.depot.oxygen+=3;}}
}
