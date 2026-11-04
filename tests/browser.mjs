import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.TEST_URL||'http://127.0.0.1:4173';
await fs.mkdir('qa',{recursive:true});
let browser,launchError;for(const channel of ['msedge','chrome',undefined])try{browser=await chromium.launch({channel,headless:true});break}catch(e){launchError=e}if(!browser)throw launchError;
const errors=[];const contexts=[];const context=await browser.newContext({viewport:{width:1366,height:768}});contexts.push(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(url);await page.locator('.start-button').waitFor();await page.screenshot({path:'qa/lobby.png'});
 await page.click('[data-do=practice]');await page.locator('#confirm').waitFor();await page.screenshot({path:'qa/match-desktop.png'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Desktop overflow');
 const boardBounds=await page.locator('.colony-board').boundingBox();for(const label of await page.locator('.node-label').all()){const b=await label.boundingBox();assert(b.y+b.height<=boardBounds.y+boardBounds.height,'District label clipped on laptop');}
 const primary=await page.locator('#confirm').boundingBox();assert(primary.y+primary.height<=768,'Primary action below laptop fold');
 for(let round=1;round<=20;round++){
  assert.equal((await page.locator('.round-label b').innerText()).trim(),String(round).padStart(2,'0'));
  await page.click('[data-do=suggest]');await page.waitForFunction(()=>!document.querySelector('#confirm').disabled);assert(await page.locator('#confirm').isEnabled(),`Round ${round} suggestion invalid`);await page.click('#confirm');
  if(round===1){assert.equal((await page.locator('.cash').innerText()).replace(/\s+/g,' ').trim(),'17 credits');assert.equal(await page.locator('.panel-heading h2').innerText(),'Depot');}
  if(round===2){assert.equal(await page.locator('.panel-heading h2').innerText(),'Habitat');assert.equal((await page.locator('.cash').innerText()).replace(/\s+/g,' ').trim(),'17 credits');}
  if(round===3){await page.reload();await page.click('[data-do=resume]');await page.locator('#confirm').waitFor();assert.equal((await page.locator('.round-label b').innerText()).trim(),'04');}
 }
 await page.locator('.result-screen.survived').waitFor();assert((await page.locator('.score-table').innerText()).includes('44'));await page.screenshot({path:'qa/result.png'});
 await page.click('[data-do=history]');assert.equal(await page.locator('.ledger-round').count(),20);await page.click('[data-do=close-ledger]');
 // Check the compact client with real controls, not a resized image.
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1});contexts.push(mobile);const phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(url);await phone.click('[data-do=practice]');await phone.locator('#confirm').waitFor();assert(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');await phone.locator('#confirm').scrollIntoViewIfNeeded();await phone.screenshot({path:'qa/match-mobile.png'});await phone.click('#confirm');assert.equal((await phone.locator('.round-label b').innerText()).trim(),'02');
 await phone.emulateMedia({reducedMotion:'reduce'});assert.equal(await phone.locator('.district').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
 // Two independent browser contexts exercise public orders and actual server cutoff.
 const hostContext=await browser.newContext(),guestContext=await browser.newContext();contexts.push(hostContext,guestContext);const host=await hostContext.newPage(),guest=await guestContext.newPage();for(const p of [host,guest])p.on('pageerror',e=>errors.push(e.message));
 await host.goto(url);await host.click('[data-do=create-room]');await host.locator('.room-code strong').waitFor();const code=await host.locator('.room-code strong').innerText();assert.match(code,/^[0-9A-F]{6}$/);
 await guest.goto(url+'/?room='+code);await guest.locator('#join-form button').click();await guest.locator('.room-code strong').waitFor();await host.click('[data-do=ready]');await guest.click('[data-do=ready]');await host.locator('#confirm').waitFor();await guest.locator('#confirm').waitFor();
 await host.click('#confirm');await host.waitForFunction(()=>document.querySelector('.public-order.included')?.textContent.includes('Load 3 oxygen'));assert(!(await guest.locator('.public-order.included').innerText()).includes('Load 3 oxygen'));await guest.click('[data-do=history]');assert((await guest.locator('.public-included').innerText()).includes('Load 3 oxygen'));await guest.click('[data-do=close-ledger]');
 assert((await host.locator('.cash').innerText()).includes('25'),'Included order must not spend settled credits');
 await host.goto(url+'/?room='+code);await host.locator('#join-form button').click();await host.locator('#confirm').waitFor();assert((await host.locator('.panel-heading .eyebrow').innerText()).includes('MERCHANT A'),'Reconnect must preserve seat');
 await host.waitForFunction(()=>document.querySelector('.round-label b')?.textContent.trim()==='02',{},{timeout:20000});assert((await host.locator('.cash').innerText()).includes('17'));assert((await guest.locator('.round-label b').innerText()).includes('02'));
 assert.deepEqual(errors,[]);
 const report={passed:true,guidedMatchRounds:20,savedMatchResumed:true,desktopAndMobile:true,roomPlayers:2,publicOrderBeforeSettlement:true,serverCutoffSettled:true,reconnectRestoredSeat:true,scriptErrors:errors};await fs.writeFile('qa/browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{for(const c of contexts)await c.close();await browser.close();}
