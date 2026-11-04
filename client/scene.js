import {icon} from './icons.js';

// A small presentation layer. It never changes match state or invents a receipt.
const anchors={depot:[12,68],habitat:[47,39],clinic:[65,65]};
const seats=['A','B','NPC'];
const flights=new Map();
let activeMatch,latestEffect=null;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function pose(location,seat){const [x,y]=anchors[location];const i=seats.indexOf(seat);return {x:x+i*7,y:y+i*5};}
export function fleetHTML(game,you){return seats.map(seat=>{const p=pose(game.merchants[seat].location,seat);return `<div class="merchant-ship seat-${seat}" data-ship="${seat}" style="left:${p.x}%;top:${p.y}%" role="img" aria-label="${seat===you?'Your':seat==='NPC'?'NPC':'Rival'} cargo ship at ${game.merchants[seat].location}"><span class="engine-glow"></span><img src="/assets/merchant-ship.webp" width="256" height="171" alt=""><span class="ship-name">${icon(seat)}${seat===you?'YOU':seat}</span></div>`;}).join('')+'<div class="scene-effects" aria-hidden="true"></div><div class="round-event" role="status" hidden></div>';}
export function captureFleet(){const board=document.querySelector('.colony-board');if(!board)return {};const b=board.getBoundingClientRect();return Object.fromEntries([...board.querySelectorAll('[data-ship]')].map(el=>{const r=el.getBoundingClientRect();return [el.dataset.ship,{x:(r.left-b.left)/b.width*100,y:(r.top-b.top)/b.height*100}];}));}
export function animateScene(game,transition,positions,you){
 const board=document.querySelector('.colony-board');if(!board)return;
 if(activeMatch!==game.id){activeMatch=game.id;flights.clear();latestEffect=null;}
 const now=performance.now(),rect=board.getBoundingClientRect();
 if(transition){
  for(const seat of seats){const order=transition.record.orders[seat],receipt=transition.record.receipts[seat];if(order.kind==='travel'&&receipt.accepted&&transition.before.merchants[seat].location!==game.merchants[seat].location){flights.set(seat,{from:positions[seat]||pose(transition.before.merchants[seat].location,seat),to:pose(game.merchants[seat].location,seat),start:now,end:now+1100});}}
  const own=transition.record.orders[you],r=transition.record.receipts[you];
  const labels={load:`Loaded ${r.filled} ${own.good} · ${r.cost} credits spent`,travel:`Arrived at ${game.merchants[you].location}`,sell:`Delivered ${r.filled} ${own.good} · +${r.payout} credits`,wait:'Held position · colony demand resolved'};
  latestEffect={until:now+2600,text:`ROUND ${String(transition.record.round).padStart(2,'0')} SETTLED · ${r.accepted?labels[own.kind]:r.reason}`,kind:own.kind,good:own.good,quantity:r.filled,payout:r.payout,accepted:r.accepted,location:game.merchants[you].location};
  const oxygen=document.querySelector('.life-main');if(oxygen&&!reduced())oxygen.animate([{backgroundColor:game.colony.critical?'#ff827730':'#9cdbc32b'},{backgroundColor:'transparent'}],{duration:700});
 }
 for(const [seat,f] of flights){
  const el=board.querySelector(`[data-ship="${seat}"]`);if(!el)continue;
  if(now>=f.end||reduced()){flights.delete(seat);continue;}
  const progress=Math.min(1,(now-f.start)/(f.end-f.start));
  const from=positions[seat]||{x:f.from.x+(f.to.x-f.from.x)*progress,y:f.from.y+(f.to.y-f.from.y)*progress};
  el.dataset.moving='true';
  const a=el.animate([{transform:`translate(${(from.x-f.to.x)*rect.width/100}px,${(from.y-f.to.y)*rect.height/100}px)`},{transform:'translate(0,0)'}],{duration:f.end-now,easing:'cubic-bezier(.25,.65,.3,1)'});
  a.finished.then(()=>{el.dataset.moving='false';if(flights.get(seat)===f)flights.delete(seat);}).catch(()=>{});
 }
 if(latestEffect&&now<latestEffect.until){
  const el=board.querySelector('.round-event');el.hidden=false;el.textContent=latestEffect.text;el.classList.toggle('event-rejected',!latestEffect.accepted);
  const effect=latestEffect;
  setTimeout(()=>{if(latestEffect===effect){const label=board.querySelector('.round-event');if(label)label.hidden=true;}},effect.until-now);
  if(transition&&effect.accepted&&['load','sell'].includes(effect.kind)){
   const p=pose(effect.location,you),packet=document.createElement('div');packet.className='cargo-transfer';packet.style.left=p.x+'%';packet.style.top=p.y+'%';packet.innerHTML=`<span class="resource ${effect.good}"></span><b>${effect.kind==='sell'?'+'+effect.payout+' cr':'+'+effect.quantity}</b>`;board.querySelector('.scene-effects').append(packet);
   if(!reduced())packet.animate([{transform:'translateY(0)',opacity:0},{transform:'translateY(-20px)',opacity:1,offset:.2},{transform:'translateY(-65px)',opacity:0}],{duration:1400}).finished.then(()=>packet.remove()).catch(()=>packet.remove());else setTimeout(()=>packet.remove(),900);
  }
 }
}
