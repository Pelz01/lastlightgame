import test from 'node:test';import assert from 'node:assert/strict';import {KeyPair} from '@near-js/crypto';import {decodeSignedTransaction} from '@near-js/transactions';import {signGameCall} from '../game/near-signing.js';
test('restricted signer advances nonce despite lagging RPC state and retries only nonce collisions',async()=>{
 const key=KeyPair.fromRandom('ed25519'),nonces=[];let collision=true;
 const rpc=async(method,params)=>{if(method==='query'){assert.equal(params.finality,'optimistic');return {nonce:1,block_hash:'11111111111111111111111111111111'};}const tx=decodeSignedTransaction(Buffer.from(params[0],'base64'));nonces.push(Number(tx.transaction.nonce));if(collision){collision=false;throw Error('InvalidNonce: {"ak_nonce":10}');}return {status:{SuccessValue:''}};};
 const call={accountId:'merchant.testnet',privateKey:key.toString(),contractId:'game.testnet',method:'submit_order',args:{match_id:'000001',round:1,order:{kind:'wait'}},rpc};await signGameCall(call);await signGameCall(call);assert.deepEqual(nonces,[2,11,12]);
 let attempts=0;await assert.rejects(signGameCall({...call,rpc:async(method)=>{if(method==='query')return {nonce:4,block_hash:'11111111111111111111111111111111'};attempts++;throw Error('NotEnoughAllowance');}}),/NotEnoughAllowance/);assert.equal(attempts,1);
});
