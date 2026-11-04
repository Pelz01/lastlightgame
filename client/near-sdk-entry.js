export {NearConnector} from '@hot-labs/near-connect';
export {KeyPair} from '@near-js/crypto';
export {actionCreators as actions} from '@near-js/transactions';
import {KeyPair} from '@near-js/crypto';
import {createTransaction,SignedTransaction,Signature,actionCreators} from '@near-js/transactions';
import {sha256} from '@noble/hashes/sha256';
import bs58 from 'bs58';
// Deliberately narrow signer: non-payable calls to this contract only. No transfers.
export async function signGameCall({accountId,privateKey,contractId,method,args,rpc}){
 if(!['join_match','ready_match','submit_order','settle_round'].includes(method))throw Error('Method is outside the game key permissions');
 const key=KeyPair.fromString(privateKey),publicKey=key.getPublicKey();
 const access=await rpc('query',{request_type:'view_access_key',finality:'final',account_id:accountId,public_key:publicKey.toString()});
 const tx=createTransaction(accountId,publicKey,contractId,BigInt(access.nonce)+1n,[actionCreators.functionCall(method,new TextEncoder().encode(JSON.stringify(args)),30000000000000n,0n)],bs58.decode(access.block_hash));
 const signed=new SignedTransaction({transaction:tx,signature:new Signature({keyType:publicKey.keyType,data:key.sign(sha256(tx.encode())).signature})});
 return rpc('broadcast_tx_commit',[btoa(String.fromCharCode(...signed.encode()))]);
}
