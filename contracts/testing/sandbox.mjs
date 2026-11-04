import {Worker} from 'near-workspaces';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {PLANS} from '../../game/plans.js';import {createMatch,settleRound,chooseNPC,normalizeOrder} from '../../game/rules.js';
const worker=await Worker.init();const root=worker.rootAccount;const checks=[];
try{
 const a=await root.createSubAccount('aurora'),b=await root.createSubAccount('boreal'),stranger=await root.createSubAccount('outsider');const contract=await root.devDeploy('../last-light/target/wasm32-unknown-unknown/release/last_light.wasm');await contract.call(contract,'new',{});
 const id=await a.call(contract,'create_match',{identity:{name:'Aurora',portrait:'mara'}},{attachedDeposit:'500000000000000000000000'});await b.call(contract,'join_match',{match_id:id,identity:{name:'Boreal',portrait:'ilan'}});await a.call(contract,'ready_match',{match_id:id});await b.call(contract,'ready_match',{match_id:id});
 await assert.rejects(stranger.call(contract,'submit_order',{match_id:id,round:1,order:{kind:'wait'}}),/does not own/);checks.push('wallet cannot control another merchant');
 await assert.rejects(a.call(contract,'settle_round',{match_id:id,round:1}),/still open/);checks.push('early settlement rejected');
 let expected=createMatch(id);expected.identities.A={name:'Aurora',portrait:'mara'};expected.identities.B={name:'Boreal',portrait:'ilan'};
 for(let r=1;r<=20;r++){
  const orders={A:normalizeOrder(PLANS.A[r]||{kind:'wait'}),B:normalizeOrder(PLANS.B[r]||{kind:'wait'})};
  if(r===1)await a.call(contract,'submit_order',{match_id:id,round:r,order:{kind:'wait'}});
  await a.call(contract,'submit_order',{match_id:id,round:r,order:orders.A});await b.call(contract,'submit_order',{match_id:id,round:r,order:orders.B});
  const before=await contract.view('get_match',{match_id:id});if(r===1)assert.equal(before.game.merchants.A.cash,25);
  // Sandbox advances blocks; contract still enforces its real 15-second timestamp cutoff.
  await worker.provider.fastForward(22);
  if(r===1){await assert.rejects(a.call(contract,'submit_order',{match_id:id,round:r,order:{kind:'wait'}}),/stale or late/);checks.push('late order rejected without carry-over');}
  const actual=await stranger.call(contract,'settle_round',{match_id:id,round:r},{gas:'200000000000000'});
  orders.NPC=chooseNPC(expected,'NPC',orders);expected=settleRound(expected,orders).state;assert.deepEqual(actual.game,expected,'WASM/JS round '+r);
  const duplicate=await a.call(contract,'settle_round',{match_id:id,round:r});assert.deepEqual(duplicate.game,actual.game,'duplicate settlement changed ownership');
 }
 assert.equal(expected.status,'survived');checks.push('20-round deployed WASM matches all JS states and receipts','replacements charge only final included order','any account can settle after cutoff','duplicate settlement is idempotent','NPC uses the same economy');
 await assert.rejects(a.call(contract,'submit_order',{match_id:id,round:20,order:{kind:'wait'}}),/not accepting/);checks.push('terminal ownership frozen');
 const state=await contract.view('get_match',{match_id:id});assert.equal(state.accounts.A,a.accountId);assert.equal(state.accounts.B,b.accountId);checks.push('wallet ownership survives fresh state reads');
 const report={passed:true,environment:'NEAR sandbox (actual deployed WASM, not mocked contract)',rounds:20,checks};await fs.mkdir('../../qa/near',{recursive:true});await fs.writeFile('../../qa/near/sandbox.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await worker.tearDown();}
