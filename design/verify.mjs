import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {chromium} from 'playwright';
const root=path.dirname(fileURLToPath(import.meta.url)),runtime=path.join(root,'runtime');
await fs.mkdir(path.join(root,'qa'),{recursive:true});
const manifest=JSON.parse(await fs.readFile(path.join(runtime,'manifest.json'),'utf8'));
assert(Object.values(manifest.budgets.checks).every(Boolean));
for(const name of ['resources','districts']){
 const atlas=JSON.parse(await fs.readFile(path.join(runtime,name+'.json'),'utf8'));
 const m=await sharp(path.join(runtime,name+'.webp')).metadata();assert(m.hasAlpha);assert.equal(Object.keys(atlas.frames).length,3);
 for(const {frame} of Object.values(atlas.frames)){assert(frame.x+frame.w<=m.width);assert(frame.y+frame.h<=m.height);}
 const {data}=await sharp(path.join(runtime,name+'.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(data[3],0,'Atlas corner must be transparent');
}
const source=await sharp(path.join(root,'assets/merchant-ship-v1.png')).raw().ensureAlpha().toBuffer({resolveWithObject:true});
assert.equal(source.data[3],0,'Ship corner must be transparent');
let browser;let launchError;
for(const channel of ['msedge','chrome',undefined]){try{browser=await chromium.launch({channel,headless:true});break;}catch(e){launchError=e;}}
if(!browser)throw launchError;
const page=await browser.newPage();const errors=[];const requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
await page.goto(pathToFileURL(path.join(runtime,'index.html')).href);
await page.evaluate(()=>document.fonts.ready);
const checks=[];
for(const [label,width,height] of [['desktop',1366,768],['mobile',390,844]]){
 await page.setViewportSize({width,height});await page.selectOption('#screen','match');
 await page.locator('#game').scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(root,'qa',label+'.png'),fullPage:false});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' horizontal overflow');
 const boardBounds=await page.locator('.board').boundingBox();for(const node of await page.locator('.node-label').all()){const b=await node.boundingBox();assert(b.y>=boardBounds.y&&b.y+b.height<=boardBounds.y+boardBounds.height,label+' district label clipped');}
 const actionBounds=await page.locator('#confirm-action').boundingBox();const gameBounds=await page.locator('#game').boundingBox();assert(actionBounds.y+actionBounds.height-gameBounds.y<=height,label+' primary action must fit game viewport');
 for(const action of ['travel','load','oxygen','medicine','fuel','wait']){await page.selectOption('#action-kind',action);assert((await page.locator('#action-title').innerText()).length>3);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),action+' overflow');}
 await page.selectOption('#action-kind','travel');
 for(const state of ['preview','queued','included','settled','rejected']){await page.selectOption('#order-state',state);assert((await page.locator('#order-message').innerText()).includes(state.toUpperCase()));}
 await page.selectOption('#colony-state','critical');assert(await page.locator('#critical-banner').isVisible());
 for(const screen of ['lobby','loading','survived','collapse','reconnect','help','settings']){await page.selectOption('#screen',screen);assert(await page.locator('#other-screen').isVisible());assert((await page.locator('#overlay-content').innerText()).length>40);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),screen+' overflow');}
 await page.selectOption('#screen','match');await page.selectOption('#colony-state','normal');await page.selectOption('#order-state','preview');await page.click('#confirm-action');assert.equal(await page.inputValue('#order-state'),'queued');
 checks.push({viewport:label,screenStates:8,actionVariants:6,orderStates:5,noHorizontalOverflow:true,primaryActionFits:true});
}
await page.setViewportSize({width:1366,height:1000});await page.locator('#cargo').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'qa','assets.png')});
await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.btn').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(async i=>{i.loading='eager';await i.decode();})));
const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src));assert.deepEqual(broken,[]);assert.deepEqual(errors,[]);assert(!requests.some(u=>u.startsWith('http')),'Preview must run without network');
await browser.close();
const report={passed:true,checks,budgets:manifest.budgets,icons:manifest.iconNames.length,brokenImages:broken,scriptErrors:errors,externalRequests:0,note:'Local browser/design validation, not game performance or chain integration.'};
await fs.writeFile(path.join(root,'qa/report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
