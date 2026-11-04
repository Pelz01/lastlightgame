import {chooseNPC,npcReason,normalizeOrder} from '../game/rules.js';
import {nearView,nearRpc} from '../game/near-rpc.js';import {signGameCall} from '../game/near-signing.js';
export class D1NpcJobs {
 constructor(db){this.db=db;}
 async claim(contract,id,round,token,now){return this.db.prepare('INSERT INTO npc_jobs (contract_id,match_id,round,lease_token,lease_until,status) VALUES (?,?,?,?,?,?) ON CONFLICT(contract_id,match_id,round) DO UPDATE SET lease_token=excluded.lease_token,lease_until=excluded.lease_until,status=excluded.status WHERE npc_jobs.status != ? AND npc_jobs.lease_until < ? RETURNING lease_token').bind(contract,id,round,token,now+90000,'pending','confirmed',now).first();}
 async get(contract,id,round){return this.db.prepare('SELECT tx_hash,status FROM npc_jobs WHERE contract_id=? AND match_id=? AND round=?').bind(contract,id,round).first();}
 async receipts(contract,id){const result=await this.db.prepare('SELECT round,tx_hash FROM npc_jobs WHERE contract_id=? AND match_id=? AND status=? ORDER BY round LIMIT 20').bind(contract,id,'confirmed').all();return result.results;}
 async complete(contract,id,round,token,hash){await this.db.prepare('UPDATE npc_jobs SET status=?,tx_hash=? WHERE contract_id=? AND match_id=? AND round=? AND lease_token=?').bind('confirmed',hash,contract,id,round,token).run();}
 async fail(contract,id,round,token){await this.db.prepare('UPDATE npc_jobs SET lease_until=? WHERE contract_id=? AND match_id=? AND round=? AND lease_token=?').bind(Date.now()+2000,contract,id,round,token).run();}
 async release(contract,id,round,token){await this.db.prepare('UPDATE npc_jobs SET lease_until=0 WHERE contract_id=? AND match_id=? AND round=? AND lease_token=?').bind(contract,id,round,token).run();}
}
export function createNpcAgent({contractId,rpcUrl,accountId,privateKey,jobs}){
 const config={contractId,rpcUrl};
 async function act(matchId){
  if(!/^[A-F0-9]{6}$/.test(matchId))throw Error('Invalid match code');if(!privateKey||!accountId||!jobs)throw Error('NPC wallet is unavailable');
  const state=await nearView(config,'get_match',{match_id:matchId});if(state.npc_wallet!==accountId)throw Error('NPC account does not match the contract');
  if(!state.started||state.game.status!=='playing'||state.deadline===null||state.serverNow>=state.deadline)return {status:'idle'};
  const round=state.game.round,existing=await jobs.get(contractId,matchId,round);if(state.pending.NPC||existing?.status==='confirmed')return {status:'included',round,hash:existing?.tx_hash||null,account:accountId};
  const token=crypto.randomUUID(),walletLease=await jobs.claim(contractId,'@wallet',0,token,Date.now());if(walletLease?.lease_token!==token)return {status:'pending',round};
  try{
   const lease=await jobs.claim(contractId,matchId,round,token,Date.now());if(lease?.lease_token!==token)return {status:'pending',round};
   const order=normalizeOrder(chooseNPC(state.game,'NPC',state.pending)),reason=npcReason(state.game,state.pending);
   const result=await signGameCall({accountId,privateKey,contractId,method:'submit_order',args:{match_id:matchId,round,order,reason},rpc:(method,params)=>nearRpc(config,method,params)});
   if(result.status?.Failure)throw Error('NPC transaction rejected: '+JSON.stringify(result.status.Failure));const hash=result.transaction?.hash;if(!hash)throw Error('NPC transaction hash missing');
   const final=await nearRpc(config,'tx',{tx_hash:hash,sender_account_id:accountId,wait_until:'FINAL'});if(final.status?.Failure)throw Error('NPC transaction failed');
   await jobs.complete(contractId,matchId,round,token,hash);return {status:'included',round,hash,account:accountId,reason};
  }catch(error){await jobs.fail(contractId,matchId,round,token);throw error;}finally{await jobs.release(contractId,'@wallet',0,token);}
 }
 // D1 owns serialization. Never share request-bound promises across Worker invocations.
 return act;
}
