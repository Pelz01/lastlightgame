import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {icons,symbol} from './src/icons.mjs';
import {tokens} from './src/tokens.mjs';
import {gallery} from './src/gallery.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(root,'runtime');
await fs.mkdir(out,{recursive:true});
const write=(name,data)=>fs.writeFile(path.join(out,name),data);
const src=name=>path.join(root,'assets',name);
const outputs=[];
async function image(name,input,width,quality=78){await sharp(input).resize({width,withoutEnlargement:true}).webp({quality,alphaQuality:90,effort:6}).toFile(path.join(out,name));outputs.push(name);}
await image('colony-960.webp',src('colony-environment-v1.png'),960,76);
await image('colony-1440.webp',src('colony-environment-v1.png'),1440,80);
await image('merchant-ship.webp',src('merchant-ship-v1.png'),256,80);
await image('concept-preview.webp',src('gameplay-concept-v1.png'),1200,78);
async function atlas(name,source,regions,size){
 const composites=[];const frames={};
 for(let i=0;i<regions.length;i++){
  const {key,left,width}=regions[i];const meta=await sharp(src(source)).metadata();
  const region=await sharp(src(source)).extract({left,top:0,width,height:meta.height}).png().toBuffer();
  const buffer=await sharp(region).trim({threshold:12}).resize(size-16,size-16,{fit:'inside'}).png().toBuffer();
  const m=await sharp(buffer).metadata();composites.push({input:buffer,left:i*size+Math.floor((size-m.width)/2),top:Math.floor((size-m.height)/2)});
  frames[key]={frame:{x:i*size,y:0,w:size,h:size},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:size,h:size},sourceSize:{w:size,h:size}};
 }
 const png=await sharp({create:{width:size*regions.length,height:size,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composites).png().toBuffer();
 await image(`${name}.webp`,png,size*regions.length,82);
 await write(`${name}.json`,JSON.stringify({frames,meta:{app:'Last Light asset pipeline',image:`${name}.webp`,format:'RGBA8888',size:{w:size*regions.length,h:size},scale:'1'}},null,2));
}
await atlas('resources','resource-atlas-v1.png',[{key:'oxygen',left:0,width:724},{key:'medicine',left:724,width:724},{key:'fuel',left:1448,width:724}],256);
await atlas('districts','district-atlas-v1.png',[{key:'depot',left:0,width:900},{key:'habitat',left:900,width:580},{key:'clinic',left:1480,width:692}],384);
const symbols=Object.entries(icons).map(([n,b])=>symbol(n,b)).join('');
await write('icons.svg',`<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`);
await fs.mkdir(path.join(out,'icons'),{recursive:true});
for(const [name,body] of Object.entries(icons)) await write(`icons/${name}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e9e7d9" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`);
await write('wordmark.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 44" role="img" aria-label="Last Light"><path fill="#9cdbc3" d="m150 4 2 15 8 3-8 3-2 15-2-15-8-3 8-3z"/><g fill="none" stroke="#e9e7d9" stroke-width="3" stroke-linejoin="miter"><path d="M5 9v25h16M28 34l9-25 9 25m-14-9h10M70 9H53v12h17v13H53M78 9h23M89.5 9v25M173 9v25h16M199 9v25M233 9h-18v25h18V22h-8M246 9v25m17-25v25m-17-13h17M274 9h23M285.5 9v25"/></g></svg>');
await write('mark.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#090e11"/><path d="m32 7 3 20 15 5-15 5-3 20-3-20-15-5 15-5z" fill="#9cdbc3"/></svg>');
await write('tokens.json',JSON.stringify(tokens,null,2));
const vars=Object.entries(tokens).flatMap(([group,values])=>Object.entries(values).map(([key,value])=>`--ll-${group}-${key}:${value}`)).join(';');
await write('tokens.css',`:root{${vars}}`);
await fs.copyFile(path.join(root,'node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-600-normal.woff2'),path.join(out,'barlow-condensed-latin-600.woff2'));
await fs.copyFile(path.join(root,'node_modules/@fontsource/barlow-condensed/LICENSE'),path.join(out,'FONT-LICENSE.txt'));
await fs.copyFile(path.join(root,'src/audio.mjs'),path.join(out,'audio.mjs'));
await fs.copyFile(path.join(root,'src/components.css'),path.join(out,'components.css'));
await fs.copyFile(path.join(root,'src/gallery.js'),path.join(out,'gallery.js'));
await write('index.html',gallery(symbols,icons));
const loadGroups={boot:['tokens.css','components.css','icons.svg','mark.svg','wordmark.svg','barlow-condensed-latin-600.woff2'],match:['resources.webp','resources.json','districts.webp','districts.json','merchant-ship.webp'],lobbyMobile:['colony-960.webp'],lobbyDesktop:['colony-1440.webp'],optionalSound:['audio.mjs'],referenceOnly:['concept-preview.webp']};
const list=await fs.readdir(out,{recursive:true});const files={};
for(const relative of list){const p=path.join(out,relative);if(!(await fs.stat(p)).isFile()||relative==='manifest.json')continue;const data=await fs.readFile(p);files[relative.replaceAll('\\','/')]={bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')};}
const groupBytes=Object.fromEntries(Object.entries(loadGroups).map(([name,names])=>[name,names.reduce((s,n)=>s+files[n].bytes,0)]));
const initialMatchBytes=groupBytes.boot+groupBytes.match;
const initialLobbyMobileBytes=groupBytes.boot+groupBytes.lobbyMobile;
const limits={initialMatchBytes:750000,initialLobbyMobileBytes:500000,allRasterTextureBytes:1500000};
const textureBytes=outputs.filter(n=>n!=='concept-preview.webp').reduce((s,n)=>s+files[n].bytes,0);
const checks={initialMatch:initialMatchBytes<=limits.initialMatchBytes,lobbyMobile:initialLobbyMobileBytes<=limits.initialLobbyMobileBytes,rasters:textureBytes<=limits.allRasterTextureBytes};
const manifest={version:1,generatedBy:'node build.mjs',files,loadGroups,groupBytes,budgets:{limits,initialMatchBytes,initialLobbyMobileBytes,textureBytes,checks},iconNames:Object.keys(icons),note:'Asset bytes only; excludes application logic, wallet SDK, RPC traffic and browser decode memory.'};
await write('manifest.json',JSON.stringify(manifest,null,2));
await fs.mkdir(path.join(root,'preview'),{recursive:true});
await fs.writeFile(path.join(root,'preview/index.html'),'<meta http-equiv="refresh" content="0;url=../runtime/index.html"><a href="../runtime/index.html">Open the Last Light design library</a>');
console.log(JSON.stringify({passed:Object.values(checks).every(Boolean),groupBytes,initialMatchBytes,initialLobbyMobileBytes,textureBytes,icons:Object.keys(icons).length},null,2));
if(!Object.values(checks).every(Boolean))process.exitCode=1;
