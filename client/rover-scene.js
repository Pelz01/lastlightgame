import {icon} from './icons.js';
import {DEFAULT_IDENTITIES} from '/game/identity.js';
const anchors={depot:[29,52],habitat:[66,38],clinic:[69,78]},seats=['A','B','NPC'];
const roads={habitat:[[29,52],[43,52],[56,38],[66,38]],clinic:[[29,52],[43,52],[58,78],[69,78]]};
const flights=new Map(),headings=new Map();let activeMatch,latestEffect=null;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isRoverMoving=seat=>!reduced()&&flights.has(seat)&&performance.now()<flights.get(seat).end;
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function pose(location,seat){const [x,y]=anchors[location],i=seats.indexOf(seat);return {x:x+(i-1)*4,y:y+i*4};}
function route(from,to,seat){const points=from==='depot'?roads[to]:roads[from]?.slice().reverse();return [pose(from,seat),...(points||[]).map(([x,y])=>({x,y})),pose(to,seat)].filter((p,i,a)=>!i||p.x!==a[i-1].x||p.y!==a[i-1].y);}
export function fleetHTML(game,you){return seats.map(seat=>{const p=pose(game.merchants[seat].location,seat),name=(game.identities||DEFAULT_IDENTITIES)[seat].name;return `<div class="merchant-rover seat-${seat}" data-rover="${seat}" data-ship="${seat}" style="left:${p.x}%;top:${p.y}%" role="img" aria-label="${escape(name)} cargo rover at ${game.merchants[seat].location}"><span class="rover-body rover-${seat}" style="--heading:${headings.get(seat)||0}deg"></span><span class="rover-dust"></span><span class="rover-name">${icon(seat)}${seat===you?'YOU':seat==='NPC'?'TESS':seat}</span></div>`;}).join('')+'<div class="scene-effects" aria-hidden="true"></div><div class="round-event" role="status" hidden></div>';}
export function captureFleet(){const board=document.querySelector('.colony-board');if(!board)return {};const b=board.getBoundingClientRect();return Object.fromEntries([...board.querySelectorAll('[data-rover]')].map(el=>{const r=el.getBoundingClientRect();return [el.dataset.rover,{x:(r.left-b.left)/b.width*100,y:(r.top-b.top)/b.height*100}];}));}
function distances(path,rect){let total=0;const sums=[0];for(let i=1;i<path.length;i++){total+=Math.hypot((path[i].x-path[i-1].x)*rect.width,(path[i].y-path[i-1].y)*rect.height);sums.push(total);}return sums.map(n=>total?n/total:1);}
function pointAt(path,offsets,p){let i=1;while(i<offsets.length-1&&offsets[i]<p)i++;const t=(p-offsets[i-1])/(offsets[i]-offsets[i-1]||1);return {x:path[i-1].x+(path[i].x-path[i-1].x)*t,y:path[i-1].y+(path[i].y-path[i-1].y)*t};}
export function animateScene(game,transition,positions,you){const board=document.querySelector('.colony-board');if(!board)return;if(activeMatch!==game.id){activeMatch=game.id;flights.clear();headings.clear();latestEffect=null;}
 const now=performance.now(),rect=board.getBoundingClientRect();
 if(transition){for(const seat of seats){const order=transition.record.orders[seat],receipt=transition.record.receipts[seat];if(order.kind==='travel'&&receipt.accepted&&transition.before.merchants[seat].location!==game.merchants[seat].location){const path=route(transition.before.merchants[seat].location,game.merchants[seat].location,seat);if(positions[seat])path[0]=positions[seat];flights.set(seat,{path,start:now,end:now+1550});}}
  const own=transition.record.orders[you],r=transition.record.receipts[you];const labels={list:`Offered ${own.amount} ${own.good} at ${own.unit_price} credits each`,buy:`Bought ${r.filled} ${own.good} · ${r.cost} credits spent`,cancel:'Offer withdrawn · cargo retained',load:`Loaded ${r.filled} ${own.good} · ${r.cost} credits spent`,travel:`Arrived at ${game.merchants[you].location}`,sell:`Delivered ${r.filled} ${own.good} · +${r.payout} credits${own.good==='fuel'?' · '+r.filled*2+' oxygen produced':''}`,wait:'Held position · colony supplies used'};
  latestEffect={until:now+2800,text:`ROUND ${String(transition.record.round).padStart(2,'0')} COMPLETE · ${r.accepted?labels[own.kind]:r.reason}`,kind:own.kind,good:own.good,quantity:r.filled,payout:r.payout,cost:r.cost,accepted:r.accepted,location:game.merchants[you].location};
  if(!reduced())document.querySelector('.life-main')?.animate([{backgroundColor:game.colony.critical?'#ff827730':'#9cdbc32b'},{backgroundColor:'transparent'}],{duration:700});
 }
 for(const [seat,f]of flights){const el=board.querySelector(`[data-rover="${seat}"]`);if(!el)continue;const last=f.path.at(-1),beforeLast=f.path.at(-2),angle=Math.atan2((last.y-beforeLast.y)*rect.height,(last.x-beforeLast.x)*rect.width)*180/Math.PI;headings.set(seat,angle);
  if(now>=f.end||reduced()){flights.delete(seat);el.querySelector('.rover-body').style.setProperty('--heading',angle+'deg');continue;}
  const offsets=distances(f.path,rect),progress=Math.max(0,(now-f.start)/(f.end-f.start)),current=positions[seat]||pointAt(f.path,offsets,progress);
  const remaining=[{point:current,offset:0},...f.path.map((point,i)=>({point,offset:(offsets[i]-progress)/(1-progress)})).filter(p=>p.offset>0)];
  const keyframes=remaining.map(({point,offset})=>({offset:Math.min(1,offset),transform:`translate(${(point.x-last.x)*rect.width/100}px,${(point.y-last.y)*rect.height/100}px)`}));
  el.dataset.moving='true';const animation=el.animate(keyframes,{duration:f.end-now,easing:'linear'});
  const turns=remaining.map(({point,offset},i)=>{const next=remaining[i+1]?.point||point;return {offset:Math.min(1,offset),transform:`rotate(${i===remaining.length-1?angle:Math.atan2((next.y-point.y)*rect.height,(next.x-point.x)*rect.width)*180/Math.PI}deg)`};});
  el.querySelector('.rover-body').animate(turns,{duration:f.end-now,fill:'forwards'});
  animation.finished.then(()=>{el.dataset.moving='false';if(flights.get(seat)===f)flights.delete(seat);document.dispatchEvent(new CustomEvent('rover-arrived'));}).catch(()=>{});
 }
 if(latestEffect&&now<latestEffect.until){const label=board.querySelector('.round-event');label.hidden=false;label.textContent=latestEffect.text;label.classList.toggle('event-rejected',!latestEffect.accepted);const effect=latestEffect;setTimeout(()=>{if(latestEffect===effect){const node=board.querySelector('.round-event');if(node)node.hidden=true;}},effect.until-now);
  if(transition&&effect.accepted&&['load','sell','buy'].includes(effect.kind)){const p=pose(effect.location,you),packet=document.createElement('div');packet.className='cargo-transfer';packet.style.left=p.x+'%';packet.style.top=p.y+'%';packet.innerHTML=`<span class="resource ${effect.good}"></span><b>${effect.kind==='sell'?'+'+effect.payout+' cr':effect.kind==='buy'?'−'+effect.cost+' cr':'+'+effect.quantity}</b>`;board.querySelector('.scene-effects').append(packet);if(!reduced())packet.animate([{transform:'translateY(0)',opacity:0},{transform:'translateY(-18px)',opacity:1,offset:.2},{transform:'translateY(-60px)',opacity:0}],{duration:1400}).finished.then(()=>packet.remove()).catch(()=>packet.remove());else setTimeout(()=>packet.remove(),900);}
 }
}
