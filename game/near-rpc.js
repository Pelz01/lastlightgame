export async function nearRpc(config,method,params){
 const response=await fetch(config.rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:crypto.randomUUID(),method,params}),signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('NEAR RPC unavailable ('+response.status+')');const data=await response.json();if(data.error){const detail=data.error.data?.cause?.info?.error_message||data.error.data||data.error.message;throw Error(typeof detail==='string'?detail:JSON.stringify(detail));}return data.result;
}
export async function nearView(config,method,args={}){
 const encoded=new TextEncoder().encode(JSON.stringify(args));const result=await nearRpc(config,'query',{request_type:'call_function',finality:'final',account_id:config.contractId,method_name:method,args_base64:btoa(String.fromCharCode(...encoded))});return JSON.parse(new TextDecoder().decode(new Uint8Array(result.result)));
}
