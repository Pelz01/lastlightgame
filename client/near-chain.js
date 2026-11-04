import {NEAR_CONFIG} from './near-config.js';
const METHODS=['join_match','ready_match','submit_order','settle_round'];
const SESSION_ALLOWANCE='250000000000000000000000'; // 0.25 test NEAR, contract methods only.
export async function rpc(method,params,config=NEAR_CONFIG){
 const response=await fetch(config.rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:crypto.randomUUID(),method,params}),signal:AbortSignal.timeout(35000)});
 if(!response.ok)throw Error('NEAR RPC unavailable ('+response.status+'). Your settled goods have not changed locally.');
 const data=await response.json();if(data.error){const detail=data.error.data?.cause?.info?.error_message||data.error.data||data.error.message||'NEAR request failed';throw Error(typeof detail==='string'?detail:JSON.stringify(detail));}return data.result;
}
export async function view(method,args={},config=NEAR_CONFIG){
 if(!config.contractId)throw Error('NEAR contract is not configured. Practice and local rooms are available.');
 const result=await rpc('query',{request_type:'call_function',finality:'final',account_id:config.contractId,method_name:method,args_base64:btoa(unescape(encodeURIComponent(JSON.stringify(args))))},config);
 return JSON.parse(new TextDecoder().decode(new Uint8Array(result.result)));
}
export function decodeResult(outcome){const value=outcome?.status?.SuccessValue;return value?JSON.parse(decodeURIComponent(escape(atob(value)))):null;}
export class NearGame {
 constructor({onState,onStatus,onError,onWallet,onBusy,onHealthy,config=NEAR_CONFIG}){Object.assign(this,{onState,onStatus,onError,onWallet,onBusy,onHealthy,config});this.accountId='';this.matchId='';this.busy=false;this.polling=false;this.closed=false;this.txs=[];try{this.txs=JSON.parse(localStorage.getItem('last-light-near-txs')||'[]');}catch{}}
 async init(){
  this.sdk=await import('/client/near-wallet.js');this.connector=new this.sdk.NearConnector({network:'testnet',autoConnect:true,cspNonce:document.querySelector('meta[name=wallet-nonce]')?.content.replace('__WALLET_NONCE__','')});
  this.connector.on('wallet:signIn',event=>{this.accountId=event.accounts[0]?.accountId||'';this.onWallet?.(this.accountId);});
  this.connector.on('wallet:signOut',()=>{this.accountId='';this.stop();this.onWallet?.('');});
  try{const connected=await this.connector.getConnectedWallet();this.accountId=connected.accounts[0]?.accountId||'';}catch{}
  this.onWallet?.(this.accountId);return this;
 }
 async connect(){await this.connector.connect();const connected=await this.connector.getConnectedWallet();this.accountId=connected.accounts[0]?.accountId||'';this.onWallet?.(this.accountId);return this.accountId;}
 keyName(){return 'last-light-near-session:'+this.config.contractId+':'+this.accountId;}
 session(){try{return JSON.parse(localStorage.getItem(this.keyName())||'null');}catch{return null;}}
 async enableSession(){
  if(!this.accountId)await this.connect();const key=this.sdk.KeyPair.fromRandom('ed25519');
  const action=this.sdk.actions.addKey(key.getPublicKey(),this.sdk.actions.functionCallAccessKey(this.config.contractId,METHODS,BigInt(SESSION_ALLOWANCE)));
  const wallet=await this.connector.wallet();this.onStatus?.('Authorize the game key in your wallet. It can call four game methods and spend at most 0.25 test NEAR on gas.');
  const outcome=await wallet.signAndSendTransaction({signerId:this.accountId,receiverId:this.accountId,network:'testnet',actions:[action]});
  if(!outcome?.transaction?.hash)throw Error('Key authorization was not confirmed. Reconnect your wallet and try again.');
  await this.verify(outcome.transaction.hash,this.accountId);
  localStorage.setItem(this.keyName(),JSON.stringify({privateKey:key.toString(),publicKey:key.getPublicKey().toString()}));this.onWallet?.(this.accountId);
 }
 async revokeSession(){const session=this.session();if(!session)return;const wallet=await this.connector.wallet();const outcome=await wallet.signAndSendTransaction({signerId:this.accountId,receiverId:this.accountId,network:'testnet',actions:[this.sdk.actions.deleteKey(this.sdk.KeyPair.fromString(session.privateKey).getPublicKey())]});if(!outcome?.transaction?.hash)throw Error('Revocation was not confirmed; the key is still shown as active.');await this.verify(outcome.transaction.hash,this.accountId);localStorage.removeItem(this.keyName());this.onWallet?.(this.accountId);}
 async verify(hash,receiver=this.config.contractId){
  const result=await rpc('tx',{tx_hash:hash,sender_account_id:this.accountId,wait_until:'FINAL'},this.config);
  if(result.transaction?.receiver_id!==receiver||result.transaction?.signer_id!==this.accountId)throw Error('Transaction account does not match this operation.');
  if(result.status?.Failure)throw Error('NEAR rejected the transaction: '+JSON.stringify(result.status.Failure));
  if(!('SuccessValue' in (result.status||{})))throw Error('Transaction has not completed. Refresh chain state before retrying.');return result;
 }
 async call(method,args={},deposit='0'){
  if(this.busy)throw Error('Wait for the current NEAR transaction to finish.');if(!this.accountId)await this.connect();
  this.busy=true;this.onStatus?.('Awaiting signature and NEAR confirmation…');
  try{
   sessionStorage.setItem('last-light-near-operation',JSON.stringify({method,args,contract:this.config.contractId,account:this.accountId}));
   let result;const session=this.session();
   if(session&&METHODS.includes(method)&&deposit==='0'){
    result=await this.sdk.signGameCall({accountId:this.accountId,privateKey:session.privateKey,contractId:this.config.contractId,method,args,rpc:(method,params)=>rpc(method,params,this.config)});
   }else{const wallet=await this.connector.wallet();result=await wallet.signAndSendTransaction({signerId:this.accountId,receiverId:this.config.contractId,network:'testnet',actions:[{type:'FunctionCall',params:{methodName:method,args,gas:'30000000000000',deposit}}]});}
   const hash=result?.transaction?.hash;if(!hash)throw Error('Wallet redirected or confirmation is unavailable. Reopen NEAR play to recover the transaction.');
   const confirmed=await this.verify(hash);this.record(method,args,hash);sessionStorage.removeItem('last-light-near-operation');this.onStatus?.('Confirmed.');return decodeResult(confirmed);
  }catch(error){this.onStatus?.('Transaction not confirmed. Check the chain state before retrying.');throw error;}finally{this.busy=false;this.onBusy?.();}
 }
 record(method,args,hash){this.txs.push({method,match_id:args.match_id||null,round:args.round||null,hash,account:this.accountId,contract:this.config.contractId,network:'testnet'});this.txs=this.txs.slice(-100);try{localStorage.setItem('last-light-near-txs',JSON.stringify(this.txs));}catch{}}
 async recoverRedirect(){const hashes=new URL(location.href).searchParams.get('transactionHashes');if(!hashes)return null;const operation=JSON.parse(sessionStorage.getItem('last-light-near-operation')||'null');if(!operation||operation.contract!==this.config.contractId||operation.account!==this.accountId)throw Error('Connect the wallet that signed the pending transaction to recover it.');const hash=hashes.split(',')[0],result=await this.verify(hash);const action=result.transaction.actions?.find(a=>a.FunctionCall)?.FunctionCall;if(action?.method_name!==operation.method)throw Error('Returned transaction does not match the pending game action.');this.record(operation.method,operation.args,hash);sessionStorage.removeItem('last-light-near-operation');const url=new URL(location.href);url.searchParams.delete('transactionHashes');history.replaceState(null,'',url);return {method:operation.method,value:decodeResult(result),matchId:operation.args.match_id};}
 async create(identity){const id=await this.call('create_match',{identity},'500000000000000000000000');await this.watch(id);return id;}
 async join(id,identity){await this.call('join_match',{match_id:id,identity});await this.watch(id);}
 async watch(id){this.stop();this.closed=false;this.matchId=id;this.signature='';this.autoSettleRound=null;const url=new URL(location.href);url.searchParams.set('near',id);url.searchParams.delete('room');history.replaceState(null,'',url);await this.poll();this.timer=setInterval(()=>this.poll().catch(e=>this.onError?.(e)),1200);}
 async poll(){
  if(this.polling||this.closed)return;this.polling=true;
  try{const state=await view('get_match',{match_id:this.matchId},this.config);if(this.closed)return;this.state=state;
   const signature=JSON.stringify([state.game,state.pending,state.players,state.deadline]);if(signature!==this.signature){this.signature=signature;this.onState?.(state);}this.onHealthy?.();
   // A restricted key never opens a wallet popup. Either player may settle; duplicates are harmless.
   if(state.started&&state.game.status==='playing'&&state.deadline!==null&&state.serverNow>=state.deadline&&this.session()&&!this.busy&&this.autoSettleRound!==state.game.round){this.autoSettleRound=state.game.round;await this.call('settle_round',{match_id:this.matchId,round:state.game.round});}
  }finally{this.polling=false;}
 }
 async ready(){return this.call('ready_match',{match_id:this.matchId});}
 async submit(round,order){const value=await this.call('submit_order',{match_id:this.matchId,round,order});await this.poll();return value;}
 async settle(round){const value=await this.call('settle_round',{match_id:this.matchId,round});await this.poll();return value;}
 stop(){this.closed=true;clearInterval(this.timer);}
}
