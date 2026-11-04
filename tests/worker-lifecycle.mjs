// Build first. Models request-scoped runtime bindings and a cancelled visitor request.
import {pathToFileURL} from 'node:url';import path from 'node:path';import assert from 'node:assert/strict';
import {KeyPair} from '@near-js/crypto';import {decodeSignedTransaction} from '@near-js/transactions';
import {sqliteJobs} from '../hosted/sqlite-jobs.js';import {createMatch} from '../game/rules.js';import {NEAR_CONFIG} from '../client/near-config.js';
const {default:worker}=await import(pathToFileURL(path.resolve('hosting/worker-stage/dist/server/index.js')));
const db=sqliteJobs(':memory:'),key=KeyPair.fromRandom('ed25519'),original=globalThis.fetch;let scope=0,signatures=0;
const state={game:createMatch('000001',{market:true}),npc_wallet:'tess.testnet',pending:{},started:true,deadline:Date.now()+15000,serverNow:Date.now()};
globalThis.fetch=async(url,request)=>{
 assert.equal(url,NEAR_CONFIG.rpcUrl);const {method,params}=JSON.parse(request.body);let result;
 if(method==='query'&&params.request_type==='call_function')result={result:[...Buffer.from(JSON.stringify(state))]};
 else if(method==='query')result={nonce:signatures,block_hash:'11111111111111111111111111111111'};
 else if(method==='broadcast_tx_commit'){const tx=decodeSignedTransaction(Buffer.from(params[0],'base64'));const args=JSON.parse(Buffer.from(tx.transaction.actions[0].functionCall.args).toString());assert.equal(args.round,state.game.round);state.pending.NPC=args.order;signatures++;result={transaction:{hash:'hash-'+signatures},status:{SuccessValue:''}};}
 else if(method==='tx')result={status:{SuccessValue:''}};else throw Error('Unexpected RPC');return Response.json({result});
};
try{
 for(let round=1;round<=3;round++){
  scope=round;state.game.round=round;state.pending={};const requestScope=scope,continuations=[];
  const binding={prepare(sql){assert.equal(scope,requestScope,'A D1 binding from an earlier request was reused');return db.prepare(sql);}};
  const context={waitUntil(promise){continuations.push(promise);}};
  const response=await worker.fetch(new Request('https://game.test/api/npc/tick',{method:'POST',body:JSON.stringify({match_id:'000001'})}),{DB:binding,NPC_ACCOUNT_ID:'tess.testnet',NPC_PRIVATE_KEY:key.toString()},context);
  assert.equal(response.status,200);assert.equal((await response.json()).status,'included');assert.equal(continuations.length,1,'Signing must survive the initiating visitor disconnecting');await Promise.all(continuations);
 }
 assert.equal(signatures,3);console.log('PASS: independent Worker requests use fresh D1 bindings and retain signing through waitUntil.');
}finally{globalThis.fetch=original;}
