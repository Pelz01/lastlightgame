import {timingSafeEqual} from 'node:crypto';
const matches=(a,b)=>{if(typeof a!=='string')return false;const left=Buffer.from(a),right=Buffer.from(b);return left.length===right.length&&timingSafeEqual(left,right);};
export function npcHttpHandler({agent,jobs,accountId,contractId,token,signingEnabled=true}){
 return async(req,res)=>{
  const url=new URL(req.url,'http://localhost');if(!['/api/npc/tick','/api/npc/receipts'].includes(url.pathname))return false;
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));return true;};
  if(token&&!matches(req.headers['x-last-light-token'],token))return send(401,{error:'Authentication required'});
  if(!token&&req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'Origin mismatch'});}catch{return send(403,{error:'Origin mismatch'});}}
  const receipts=url.pathname.endsWith('/receipts');if(req.method!==(receipts?'GET':'POST'))return send(405,{error:'Method not allowed'});
  if(!jobs||!accountId)return send(503,{error:'NPC wallet unavailable'});
  try{
   let match=url.searchParams.get('match_id');if(!receipts){let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>512)return send(413,{error:'Request too large'});}let parsed;try{parsed=JSON.parse(body);}catch{return send(400,{error:'Invalid request'});}if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||Object.keys(parsed).some(k=>k!=='match_id'))return send(400,{error:'Only a match code is accepted'});match=parsed.match_id;}
   if(typeof match!=='string'||!/^[A-F0-9]{6}$/.test(match))return send(400,{error:'Invalid match code'});
   if(receipts)return send(200,{account:accountId,contract:contractId,receipts:await jobs.receipts(contractId,match)});
   if(!signingEnabled)return send(503,{error:'NPC backend is switching hosts'});
   return send(200,await agent(match));
  }catch{return send(503,{error:'Tess is temporarily unavailable; a missing move becomes wait.'});}
 };
}
