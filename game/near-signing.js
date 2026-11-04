import {KeyPair} from '@near-js/crypto';
import {createTransaction,SignedTransaction,Signature,actionCreators} from '@near-js/transactions';
import {sha256} from '@noble/hashes/sha256';import bs58 from 'bs58';
// Numbers may outlive a request; request-bound promises and RPC responses may not.
const lastNonce=new Map();
export async function signGameCall({accountId,privateKey,contractId,method,args,rpc}){
 if(!['join_match','ready_match','submit_order','settle_round'].includes(method))throw Error('Method is outside the game key permissions');
 const key=KeyPair.fromString(privateKey),publicKey=key.getPublicKey(),nonceKey=accountId+':'+publicKey;
 for(let attempt=0;attempt<3;attempt++){
  // A just-included transaction can precede final access-key state during reconnect.
  const access=await rpc('query',{request_type:'view_access_key',finality:'optimistic',account_id:accountId,public_key:publicKey.toString()});
  const chainNonce=BigInt(access.nonce),previous=lastNonce.get(nonceKey)||0n,nonce=(chainNonce>previous?chainNonce:previous)+1n;lastNonce.set(nonceKey,nonce);
  const tx=createTransaction(accountId,publicKey,contractId,nonce,[actionCreators.functionCall(method,new TextEncoder().encode(JSON.stringify(args)),30000000000000n,0n)],bs58.decode(access.block_hash));
  const signed=new SignedTransaction({transaction:tx,signature:new Signature({keyType:publicKey.keyType,data:key.sign(sha256(tx.encode())).signature})});
  try{return await rpc('broadcast_tx_commit',[btoa(String.fromCharCode(...signed.encode()))]);}catch(error){if(attempt===2||!String(error).includes('InvalidNonce'))throw error;const reported=String(error).match(/ak_nonce[^0-9]+([0-9]+)/);if(reported&&BigInt(reported[1])>(lastNonce.get(nonceKey)||0n))lastNonce.set(nonceKey,BigInt(reported[1]));}
 }
}
