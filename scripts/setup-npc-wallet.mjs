import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {Account,JsonRpcProvider,KeyPair,PublicKey,actions} from 'near-api-js';
const config=JSON.parse(await fs.readFile('data/near-deployment.json','utf8'));
const directory=path.join(os.homedir(),'.near-credentials','testnet'),provider=new JsonRpcProvider({url:config.rpcUrl});
const ownerKey=JSON.parse(await fs.readFile(path.join(directory,config.accountId+'.json'),'utf8'));
const owner=new Account(config.accountId,provider,ownerKey.private_key),id=config.npcAccountId;
if(!id||id===config.accountId)throw Error('A separate testnet NPC account is required');
const file=path.join(directory,id+'.json');let key;
try{key=JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;const pair=KeyPair.fromRandom('ed25519');key={account_id:id,private_key:pair.toString(),public_key:pair.getPublicKey().toString()};await fs.writeFile(file,JSON.stringify(key),{mode:0o600,flag:'wx'});}
let exists=true;try{await provider.viewAccount({accountId:id});}catch(e){if(/does not exist|UNKNOWN_ACCOUNT|not exist/i.test(String(e)))exists=false;else throw e;}
if(!exists)await owner.createAccount({newAccountId:id,publicKey:key.public_key,nearToTransfer:1000000000000000000000000n});
const runnerFile=path.join(directory,id+'.runner.json');let runner;
try{runner=JSON.parse(await fs.readFile(runnerFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;const pair=KeyPair.fromRandom('ed25519');runner={account_id:id,private_key:pair.toString(),public_key:pair.getPublicKey().toString(),kind:'function-call',contract_id:config.accountId,allowed_methods:['submit_order']};await fs.writeFile(runnerFile,JSON.stringify(runner),{mode:0o600,flag:'wx'});}
const npc=new Account(id,provider,key.private_key);let access;
try{access=await provider.viewAccessKey({accountId:id,publicKey:runner.public_key});}catch(e){if(!/does not exist|UNKNOWN_ACCESS_KEY|not exist/i.test(String(e)))throw e;}
if(!access)await npc.signAndSendTransaction({receiverId:id,actions:[actions.addFunctionCallAccessKey(PublicKey.fromString(runner.public_key),config.accountId,['submit_order'],500000000000000000000000n)],waitUntil:'FINAL'});
access=await provider.viewAccessKey({accountId:id,publicKey:runner.public_key});const p=access.permission.FunctionCall;
if(!p||p.receiver_id!==config.accountId||JSON.stringify(p.method_names)!==JSON.stringify(['submit_order']))throw Error('NPC access-key permission mismatch');
console.log(JSON.stringify({account:id,publicKey:runner.public_key,permission:access.permission,credentialFile:runnerFile},null,2));
