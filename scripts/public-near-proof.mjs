import {nearRpc} from '../game/near-rpc.js';
let lastRead=0;
export async function publicTransaction(config,hash,account){
 // These are read-only archival queries. Keep proof audits below public RPC burst limits.
 for(let attempt=0;attempt<5;attempt++){
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,1000-(Date.now()-lastRead))));lastRead=Date.now();
  try{return await nearRpc({...config,rpcUrl:config.archiveRpcUrl||'https://archival-rpc.testnet.fastnear.com'},'tx',{tx_hash:hash,sender_account_id:account,wait_until:'FINAL'});}
  catch(error){if(!String(error).includes('(429)')||attempt===4)throw error;await new Promise(resolve=>setTimeout(resolve,3000*(attempt+1)));}
 }
}
