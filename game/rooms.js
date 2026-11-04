import {randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {createMatch,settleRound,normalizeOrder,chooseNPC,copy} from './rules.js';
import {cleanIdentity} from './identity.js';
export class RoomService{
 constructor({duration=15000,now=Date.now,store=null}={}){this.rooms=new Map();this.duration=duration;this.now=now;this.store=store;for(const saved of store?.load()||[]){const room={...saved,players:Object.fromEntries(Object.entries(saved.players).map(([seat,p])=>[seat,{...p,client:null}]))};this.rooms.set(room.code,room);}}
 persist(){this.store?.save([...this.rooms.values()].map(r=>({...r,players:Object.fromEntries(Object.entries(r.players).map(([seat,p])=>[seat,{tokenHash:p.tokenHash,ready:p.ready}]))})));}
 join({code,token,identity}={},client){
  let room;
  if(code){room=this.rooms.get(String(code).toUpperCase());if(!room)throw Error('Room not found. Check the six-character code.');}
  else{if(this.rooms.size>=50)throw Error('Local room limit reached');do{code=randomBytes(3).toString('hex').toUpperCase();}while(this.rooms.has(code));room={code,game:createMatch(code),players:{},pending:{},deadline:null,started:false,updated:this.now()};this.rooms.set(code,room);}
  const hash=token?createHash('sha256').update(token).digest('hex'):null;
  let seat=Object.keys(room.players).find(s=>hash&&timingSafeEqual(Buffer.from(hash),Buffer.from(room.players[s].tokenHash)));
  if(!seat){if(room.started)throw Error('This match has already started. Reconnect using your original tab.');seat=['A','B'].find(s=>!room.players[s]);if(!seat)throw Error('Both merchant seats are occupied');token=randomBytes(24).toString('hex');room.players[seat]={tokenHash:createHash('sha256').update(token).digest('hex'),client,ready:false};room.game.identities[seat]=cleanIdentity(identity,seat);}
  else{const previous=room.players[seat].client;if(previous&&previous!==client)previous.close(4001,'Seat reconnected elsewhere');room.players[seat].client=client;}
  client.room=code;client.seat=seat;room.updated=this.now();
  this.persist();return {room,seat,token};
 }
 ready(client){const room=this.get(client);if(room.started)throw Error('The match is already running');room.players[client.seat].ready=true;if(['A','B'].every(s=>room.players[s]?.ready&&room.players[s].client?.readyState===1)){room.started=true;room.deadline=this.now()+this.duration;}this.persist();return room;}
 get(client){const r=this.rooms.get(client.room);if(!r||r.players[client.seat]?.client!==client)throw Error('Join a room first');return r;}
 submit(client,message){const r=this.get(client);if(!r.started||r.game.status!=='playing')throw Error('The match is not accepting orders');if(message.matchId!==r.game.id||message.round!==r.game.round||this.now()>=r.deadline)throw Error('Order is stale or late. Refresh the current round.');r.pending[client.seat]=normalizeOrder(message.order);this.persist();return r;}
 tick(){const changed=[];for(const r of this.rooms.values())if(r.started&&r.game.status==='playing'&&this.now()>=r.deadline){const orders=copy(r.pending);orders.NPC=chooseNPC(r.game,'NPC',orders);r.game=settleRound(r.game,orders).state;r.pending={};r.deadline=r.game.status==='playing'?this.now()+this.duration:null;r.updated=this.now();changed.push(r);}if(changed.length)this.persist();return changed;}
 snapshot(r){return {type:'state',code:r.code,game:r.game,pending:r.pending,deadline:r.deadline,serverNow:this.now(),started:r.started,players:Object.fromEntries(Object.entries(r.players).map(([s,p])=>[s,{ready:p.ready,connected:p.client?.readyState===1}]))};}
 disconnect(client){const r=this.rooms.get(client.room);if(r?.players[client.seat]?.client===client){r.players[client.seat].client=null;r.updated=this.now();}return r;}
 prune(){let changed=false;for(const [code,r]of this.rooms)if(this.now()-r.updated>86400000&&Object.values(r.players).every(p=>!p.client)){this.rooms.delete(code);changed=true;}if(changed)this.persist();}
}
