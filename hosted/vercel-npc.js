import {proxyNpcRequest} from './proxy-npc.js';
export const vercelNpcHandler=path=>async(req,res)=>{
 let body;if(req.method!=='GET'&&req.method!=='HEAD'){body=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});}
 const protocol=req.headers['x-forwarded-proto']||(process.env.VERCEL?'https':'http');const url=new URL(req.url,protocol+'://'+req.headers.host);url.pathname=path;
 const request=new Request(url,{method:req.method,headers:{'Content-Type':'application/json',...req.headers.origin?{Origin:req.headers.origin}:{},'Content-Length':String(Buffer.byteLength(body||''))},...body===undefined?{}:{body}});
 const response=await proxyNpcRequest(request,{backendUrl:process.env.LAST_LIGHT_BACKEND_URL,token:process.env.LAST_LIGHT_BACKEND_TOKEN});
 res.statusCode=response.status;for(const[k,v]of response.headers)res.setHeader(k,v);res.end(Buffer.from(await response.arrayBuffer()));
};
