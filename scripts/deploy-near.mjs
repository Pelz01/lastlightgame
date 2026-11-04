import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';
import {Account,JsonRpcProvider,KeyPair,actions} from 'near-api-js';
const rpcUrl='https://test.rpc.fastnear.com',provider=new JsonRpcProvider({url:rpcUrl});
const directory=path.join(os.homedir(),'.near-credentials','testnet');await fs.mkdir(directory,{recursive:true});
const stateFile=path.join('data','near-deployment.json');await fs.mkdir('data',{recursive:true});
let deployment;try{deployment=JSON.parse(await fs.readFile(stateFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const id=process.env.NEAR_DEPLOY_ACCOUNT||deployment?.accountId||'last-light-'+crypto.randomBytes(4).toString('hex')+'.testnet';
if(!id.endsWith('.testnet'))throw Error('This deployment script supports testnet only');
const npcId='tess.'+id;
const file=path.join(directory,id+'.json');let credentials;
try{credentials=JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;const key=KeyPair.fromRandom('ed25519');credentials={account_id:id,public_key:key.getPublicKey().toString(),private_key:key.toString()};await fs.writeFile(file,JSON.stringify(credentials),{mode:0o600,flag:'wx'});}
let exists=true;try{await provider.viewAccount({accountId:id});}catch(error){if(/does not exist|UNKNOWN_ACCOUNT|not exist/i.test(String(error)))exists=false;else throw error;}
if(!exists){const response=await fetch('https://helper.testnet.near.org/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({newAccountId:id,newAccountPublicKey:credentials.public_key}),signal:AbortSignal.timeout(45000)});const responseText=await response.text();if(!response.ok)throw Error('Testnet faucet could not create '+id+': '+response.status+' '+responseText.slice(0,300));console.log('Faucet created testnet deployment account:',id);}
const account=new Account(id,provider,credentials.private_key);const wasm=await fs.readFile('contracts/last-light/target/wasm32-unknown-unknown/release/last_light.wasm');
let initialized=false;try{const existing=await provider.callFunction({contractId:id,method:'version',args:{}});if(existing.rules_version!==2||existing.npc_wallet!==npcId)throw Error('Incompatible existing state: select a fresh NEAR_DEPLOY_ACCOUNT; v0.2 has no state migration');initialized=true;}catch(error){if(String(error).includes('Incompatible existing state'))throw error;}
await fs.writeFile(stateFile,JSON.stringify({accountId:id,network:'testnet',rpcUrl,status:'prepared'},null,2));
const result=await account.signAndSendTransaction({receiverId:id,actions:[actions.deployContract(wasm),...initialized?[]:[actions.functionCall('new',{npc_account:npcId},50000000000000n,0n)]]});
if(result.status?.Failure)throw Error('Deployment failed: '+JSON.stringify(result.status.Failure));
const version=await provider.callFunction({contractId:id,method:'version',args:{}});if(version.rules_version!==2)throw Error('Deployed version verification failed');
const deployed={accountId:id,network:'testnet',rpcUrl,npcAccountId:npcId,status:'deployed',hash:result.transaction.hash,wasmSha256:crypto.createHash('sha256').update(wasm).digest('hex'),version};await fs.writeFile(stateFile,JSON.stringify(deployed,null,2));
await fs.writeFile('client/near-config.js','export const NEAR_CONFIG='+JSON.stringify({network:'testnet',contractId:id,rpcUrl,explorerUrl:'https://testnet.nearblocks.io',localRooms:true})+';\n');console.log(JSON.stringify(deployed,null,2));
