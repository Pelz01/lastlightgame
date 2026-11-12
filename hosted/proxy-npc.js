const json=(body,status)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function proxyNpcRequest(request,{backendUrl,token}){
 const input=new URL(request.url),receipts=input.pathname==='/api/npc/receipts';
 if(!receipts&&input.pathname!=='/api/npc/tick')return json({error:'Not found'},404);
 if(request.method!==(receipts?'GET':'POST'))return json({error:'Method not allowed'},405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==input.origin)return json({error:'Origin mismatch'},403);
 if(!backendUrl||!token)return json({error:'Backend unavailable'},503);
 let match;
 if(receipts)match=input.searchParams.get('match_id');else{
  if(Number(request.headers.get('Content-Length')||0)>512)return json({error:'Request too large'},413);
  const text=await request.text();if(new TextEncoder().encode(text).length>512)return json({error:'Request too large'},413);
  try{const body=JSON.parse(text);if(Object.keys(body).some(k=>k!=='match_id'))return json({error:'Only a match code is accepted'},400);match=body.match_id;}catch{return json({error:'Invalid request'},400);}
 }
 if(typeof match!=='string'||!/^[A-F0-9]{6}$/.test(match))return json({error:'Invalid match code'},400);
 try{
  const target=new URL(backendUrl);if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash)throw Error('Invalid backend URL');
  target.pathname=target.pathname.replace(/\/$/,'')+input.pathname;if(receipts)target.searchParams.set('match_id',match);
  const response=await fetch(target,{method:request.method,headers:{'Content-Type':'application/json','X-Last-Light-Token':token},...receipts?{}:{body:JSON.stringify({match_id:match})},redirect:'error',signal:AbortSignal.timeout(24000)});
  if(!response.headers.get('Content-Type')?.includes('application/json'))throw Error('Invalid backend response');
  return new Response(response.body,{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }catch{return json({error:'Tess is temporarily unavailable; a missing move becomes wait.'},502);}
}
