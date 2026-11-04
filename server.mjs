import {createNpcAgent,D1NpcJobs} from './hosted/npc-agent.js';
import {NEAR_CONFIG} from './client/near-config.js';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {networkInterfaces} from 'node:os';
import {WebSocketServer} from 'ws';
import {RoomService} from './game/rooms.js';
import {FileRoomStore} from './game/room-store.js';
import {randomBytes} from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||4173),host=process.env.HOST||'0.0.0.0';
const nonce=randomBytes(18).toString('base64');
let npcAgent=null;if(process.env.NEAR_NPC_KEY_FILE){const key=JSON.parse(await fs.readFile(process.env.NEAR_NPC_KEY_FILE,'utf8'));if(key.kind!=='function-call'||key.contract_id!==NEAR_CONFIG.contractId||JSON.stringify(key.allowed_methods)!==JSON.stringify(['submit_order']))throw Error('NPC requires a contract-restricted key');const {sqliteJobs}=await import('./hosted/sqlite-jobs.js');npcAgent=createNpcAgent({contractId:NEAR_CONFIG.contractId,rpcUrl:NEAR_CONFIG.rpcUrl,accountId:key.account_id,privateKey:key.private_key,jobs:new D1NpcJobs(sqliteJobs(process.env.NPC_JOB_STORE||path.join(root,'data/npc-jobs.sqlite')))});}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain'};
const assetNames=new Set(['colony-960.webp','colony-1440.webp','districts.webp','resources.webp','merchant-ship.webp','wordmark.svg','mark.svg','barlow-condensed-latin-600.woff2','FONT-LICENSE.txt','audio.mjs','colony-ground-960.webp','colony-ground-1440.webp','buildings-ground.webp','rovers-ground.webp','portraits-ground.webp']);
const networkUrls=()=>Object.values(networkInterfaces()).flat().filter(a=>a.family==='IPv4'&&!a.internal).map(a=>`http://${a.address}:${port}`);
const server=http.createServer(async(req,res)=>{
 try{
  if(req.url==='/api/npc/tick'){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');if(req.method!=='POST'||(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)){res.writeHead(403);res.end(JSON.stringify({error:'Invalid request'}));return;}if(!npcAgent){res.writeHead(503);res.end(JSON.stringify({error:'NPC wallet unavailable'}));return;}let body='';for await(const chunk of req){body+=chunk;if(body.length>512){res.writeHead(413);res.end('{}');return;}}try{const message=JSON.parse(body);const result=await npcAgent(message.match_id);res.end(JSON.stringify(result));}catch(error){res.writeHead(503);res.end(JSON.stringify({error:'Tess is temporarily unavailable'}));}return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const url=new URL(req.url,'http://localhost');let file;
  if(url.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true,"settlement":"local"}');return;}
  if(url.pathname==='/connection'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({networkUrls:host==='127.0.0.1'?[]:networkUrls(),scope:'same-network',internetHosted:false}));return;}
  if(url.pathname==='/'||url.pathname==='/index.html')file=path.join(root,'client/index.html');
  else if(/^\/client\/[a-z-]+\.(js|css)$/.test(url.pathname))file=path.join(root,url.pathname);
  else if(/^\/game\/(rules|plans|identity|goods|market|near-rpc)\.js$/.test(url.pathname))file=path.join(root,url.pathname);
  else if(url.pathname.startsWith('/assets/')&&assetNames.has(url.pathname.slice(8)))file=path.join(root,'design/runtime',url.pathname.slice(8));
  else{res.writeHead(404);res.end('Not found');return;}
  let data=await fs.readFile(file);if(path.extname(file)==='.html')data=Buffer.from(data.toString().replace('__WALLET_NONCE__',nonce));res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':`default-src 'self'; script-src 'self' https: 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-src 'self' https: blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404);res.end('Not found');}
});
const rooms=new RoomService({duration:process.env.NODE_ENV==='test'?Math.max(500,Number(process.env.LAST_LIGHT_TEST_ROUND_MS)||15000):15000,store:process.env.NODE_ENV==='test'&&!process.env.ROOM_STORE?null:new FileRoomStore(process.env.ROOM_STORE||path.join(root,'data/rooms.json'))});
const wss=new WebSocketServer({noServer:true,maxPayload:4096,perMessageDeflate:false});
server.on('upgrade',(req,socket,head)=>{
 const origin=req.headers.origin;let same=false;try{same=!origin||new URL(origin).host===req.headers.host;}catch{}
 if(req.url!=='/room'||!same){socket.destroy();return;}
 wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws));
});
const send=(ws,message)=>{if(ws?.readyState===1)ws.send(JSON.stringify(message));};
const broadcast=r=>{if(r)for(const p of Object.values(r.players))send(p.client,rooms.snapshot(r));};
wss.on('connection',ws=>{
 let windowStart=Date.now(),count=0;
 ws.on('error',()=>{});
 ws.on('message',data=>{try{
  if(Date.now()-windowStart>1000){count=0;windowStart=Date.now();}if(++count>20)throw Error('Too many requests; try again shortly');
  const m=JSON.parse(data.toString());if(!m||typeof m!=='object')throw Error('Invalid message');
  if(m.type==='join'){
   if(ws.room)throw Error('Already joined');
   const {room,seat,token}=rooms.join({code:m.code,token:typeof m.token==='string'?m.token:undefined,identity:m.identity},ws);send(ws,{type:'joined',code:room.code,seat,token});broadcast(room);
  }else if(m.type==='ready')broadcast(rooms.ready(ws));
  else if(m.type==='order')broadcast(rooms.submit(ws,m));
  else throw Error('Unknown request');
 }catch(e){send(ws,{type:'error',message:e.message});if(e.storageFailure){console.error('Durable storage failed; stopping before broadcasting an unpersisted update.');shutdown();}}});
 ws.on('close',()=>broadcast(rooms.disconnect(ws)));
});
const clock=setInterval(()=>{for(const r of rooms.tick())broadcast(r);rooms.prune();},100);
server.listen(port,host,()=>console.log(`Last Light is ready: http://127.0.0.1:${port}\nSame-network access: ${host==='127.0.0.1'?'disabled':networkUrls().join(' · ')}\nLocal settlement prototype · practice + two-player rooms`));
const shutdown=()=>{clearInterval(clock);wss.clients.forEach(ws=>ws.close());wss.close();server.close(()=>process.exit(0));};
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
