import {createNpcAgent,D1NpcJobs} from './npc-agent.js';
import {NEAR_CONFIG} from '../client/near-config.js';
import {ASSETS} from './assets.generated.js';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default {async fetch(request,env,context){
 const url=new URL(request.url);
 if(url.pathname==='/api/npc/receipts'){
  const id=url.searchParams.get('match_id');if(request.method!=='GET'||!/^[A-F0-9]{6}$/.test(id||''))return json({error:'Invalid request'},400);
  try{return json({account:env.NPC_ACCOUNT_ID,contract:NEAR_CONFIG.contractId,receipts:await new D1NpcJobs(env.DB).receipts(NEAR_CONFIG.contractId,id)});}catch{return json({error:'Receipts temporarily unavailable'},503);}
 }
 if(url.pathname==='/api/npc/tick'){
  if(request.method!=='POST')return json({error:'POST required'},405);
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'Origin mismatch'},403);
  if(Number(request.headers.get('Content-Length')||0)>512)return json({error:'Request too large'},413);
  try{const text=await request.text();if(text.length>512)return json({error:'Request too large'},413);const body=JSON.parse(text);if(typeof body.match_id!=='string'||!/^[A-F0-9]{6}$/.test(body.match_id))return json({error:'Invalid match code'},400);
   const agent=createNpcAgent({contractId:NEAR_CONFIG.contractId,rpcUrl:NEAR_CONFIG.rpcUrl,accountId:env.NPC_ACCOUNT_ID,privateKey:env.NPC_PRIVATE_KEY,jobs:env.DB?new D1NpcJobs(env.DB):null});
   const task=agent(body.match_id);context?.waitUntil(task.catch(()=>{}));return json(await task);
  }catch(error){console.error('NPC action unavailable:',String(error.message).slice(0,250));return json({error:'Tess is temporarily unavailable; a missing move becomes wait.'},503);}
 }
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const name=url.pathname==='/'?'/index.html':url.pathname,asset=ASSETS[name];if(!asset)return new Response('Not found',{status:404});
 const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));const headers={'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
 return new Response(request.method==='HEAD'?null:bytes,{headers});
}};
