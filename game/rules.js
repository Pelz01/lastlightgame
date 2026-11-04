// Deterministic local rules. Shared by practice and the room authority.
import {DEFAULT_IDENTITIES} from './identity.js';
import {GOODS,PRICE,VOLUME,volume} from './goods.js';
import {createMarket,normalizeMarketOrder,executeMarket,cancelOffer,marketNPCDecision} from './market.js';
export {GOODS,PRICE,VOLUME,volume};
export const SEATS=['A','B','NPC'];
export const RELEASES=[1,4,7,10,13,16];
export const DEADLINES=[6,12,18];
export const WAIT=Object.freeze({kind:'wait'});
export const copy=value=>structuredClone(value);
export function priority(round){if(!Number.isInteger(round)||round<1||round>20)throw Error('Invalid round');const first=(Math.floor((round-1)/3)+(round-1)%3)%3;return [...SEATS.slice(first),...SEATS.slice(0,first)];}
export function createMatch(id='practice',{market=false}={}){
 return {version:market?2:1,...market?{market:createMarket()}:{},id,round:1,settledRound:0,status:'playing',cause:null,identities:copy(DEFAULT_IDENTITIES),
 merchants:Object.fromEntries(SEATS.map(seat=>[seat,{cash:25,tank:0,location:'depot',cargo:{oxygen:0,medicine:0,fuel:0}}])),
 depot:{oxygen:3,medicine:4,fuel:24},colony:{oxygen:4,medicine:1,health:2,treasury:180,quota:18,medicine_bought:0,plant_fuel_used:0,critical:false},
 depot_revenue:0,fuel_burned:0,oxygen_consumed:0,medicine_consumed:0,history:[]};
}
export const salvage=p=>p.cargo.oxygen+p.cargo.medicine+Math.floor(p.cargo.fuel/2);
export const scores=s=>SEATS.map(seat=>({seat,cash:s.merchants[seat].cash,salvage:salvage(s.merchants[seat]),profit:s.merchants[seat].cash+salvage(s.merchants[seat])-25})).sort((a,b)=>b.profit-a.profit);
export const winners=s=>s.status==='survived'?scores(s).filter(p=>p.profit===scores(s)[0].profit).map(p=>p.seat):[];
const reject=reason=>({accepted:false,reason,filled:0,payout:0,cost:0});
const accept=(reason,extra={})=>({accepted:true,reason,filled:0,payout:0,cost:0,...extra});
const integer=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000;
export function normalizeOrder(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid order');
 const {kind,good,amount=0,destination,refill=0,minimum_total=0}=raw;
 if(!['wait','load','travel','sell','list','buy','cancel'].includes(kind)||![amount,refill,minimum_total].every(integer))throw Error('Use whole, non-negative quantities');
 if(['list','buy','cancel'].includes(kind))return normalizeMarketOrder(raw);
 if(['load','sell'].includes(kind)&&!GOODS.includes(good))throw Error('Unknown cargo');
 if(kind==='travel'&&!['depot','habitat','clinic'].includes(destination))throw Error('Unknown destination');
 return {kind,...(['load','sell'].includes(kind)?{good,amount}:{}),...(kind==='travel'?{destination}:{}),...(kind==='load'?{refill}:{}),...(kind==='sell'?{minimum_total}:{})};
}
export function execute(s,seat,raw){
 if(!SEATS.includes(seat))return reject('Unknown merchant');
 let o;try{o=normalizeOrder(raw);}catch(e){return reject(e.message);}
 const p=s.merchants[seat],c=s.colony;
 if(['list','buy','cancel'].includes(o.kind))return executeMarket(s,seat,o,accept,reject);
 if(o.kind==='wait')return accept('Waited');
 if(o.kind==='load'){
  if(p.location!=='depot')return reject('Loading is available only at the depot');
  if(o.amount===0&&o.refill===0)return reject('Choose cargo or a tank refill');
  if(p.tank+o.refill>2||volume(p)+o.amount*VOLUME[o.good]>6)return reject('Cargo or tank capacity exceeded');
  if(o.good==='oxygen'&&p.cargo.oxygen+o.amount>3)return reject('At most three oxygen per merchant');
  if(s.depot[o.good]<o.amount||s.depot.fuel<o.refill+(o.good==='fuel'?o.amount:0))return reject('Not enough depot stock');
  const cost=o.amount*PRICE[o.good]+o.refill;
  if(p.cash<cost)return reject('Not enough credits');
  p.cash-=cost;s.depot_revenue+=cost;s.depot[o.good]-=o.amount;s.depot.fuel-=o.refill;p.cargo[o.good]+=o.amount;p.tank+=o.refill;
  return accept('Loaded',{filled:o.amount,cost});
 }
 if(o.kind==='travel'){
  const valid=p.location==='depot'?['habitat','clinic'].includes(o.destination):o.destination==='depot';
  if(!valid)return reject('Travel must go through the depot');
  if(p.tank<(p.location==='depot'?2:1))return reject('Not enough fuel for the trip and return');
  cancelOffer(s,seat);p.location=o.destination;p.tank--;s.fuel_burned++;return accept('Travelled');
 }
 if(o.kind==='sell'){
  if(p.location!==(o.good==='medicine'?'clinic':'habitat'))return reject('Cargo must be sold at its district');
  if(o.amount<1||p.cargo[o.good]<1)return reject('No selected cargo to sell');
  let fill,payout;
  if(o.good==='fuel'){
   if(o.amount>p.cargo.fuel||o.amount>3-c.plant_fuel_used||o.amount*2>c.quota||c.oxygen+o.amount*2>7)return reject('Plant conversion must fill entirely within storage, quota and lifetime cap');
   fill=o.amount;payout=fill*4;
  }else{
   const room=(o.good==='oxygen'?7:2)-c[o.good];const cap=o.good==='oxygen'?c.quota:3-c.medicine_bought;
   fill=Math.min(o.amount,p.cargo[o.good],room,cap);
   payout=Array.from({length:Math.max(0,fill)},(_,i)=>o.good==='oxygen'?Math.max(4,8-c.oxygen-i):(c.medicine+i===0?8:5)).reduce((a,b)=>a+b,0);
  }
  if(fill<1)return reject('No district storage or procurement quota remains');
  if(payout<o.minimum_total)return reject('Payout fell below your minimum; cargo retained');
  if(payout>c.treasury)return reject('Treasury cannot cover the delivery');
  p.cargo[o.good]-=fill;p.cash+=payout;c.treasury-=payout;
  if(o.good==='fuel'){c.oxygen+=fill*2;c.quota-=fill*2;c.plant_fuel_used+=fill;}
  else {c[o.good]+=fill;if(o.good==='oxygen')c.quota-=fill;else c.medicine_bought+=fill;}
  return accept('Sold',{filled:fill,payout});
 }
 return reject('Unknown action');
}
export function previewOrder(state,seat,order){
 if(state.status!=='playing')return reject('The match has ended');
 const draft=copy(state),receipt=execute(draft,seat,order);
 return {...receipt,after:receipt.accepted?draft.merchants[seat]:state.merchants[seat]};
}
export function settleRound(state,orders={},round=state.round){
 if(round<=state.settledRound){const record=state.history.find(h=>h.round===round);if(!record)throw Error('Unknown settled round');return {state,record};}
 if(state.status!=='playing'||round!==state.round)throw Error('Round is stale or match is terminal');
 const s=copy(state),receipts={},boundOrders={};
 for(const seat of priority(round)){const o=orders[seat]||WAIT;boundOrders[seat]=copy(o);receipts[seat]=execute(s,seat,o);}
 const c=s.colony,wasCritical=c.critical,hadOxygen=c.oxygen>0;
 if(hadOxygen){c.oxygen--;s.oxygen_consumed++;}
 if(DEADLINES.includes(round)){if(c.medicine>0){c.medicine--;s.medicine_consumed++;}else c.health--;}
 if(wasCritical&&!hadOxygen){s.status='collapsed';s.cause='The final oxygen rescue window closed without a delivery.';}
 if(c.health<=0){s.status='collapsed';s.cause='The clinic missed two medicine deadlines.';}
 c.critical=c.oxygen===0;s.settledRound=round;
 if(round===20&&s.status==='playing'){
  if(c.oxygen>=2&&c.medicine>=1&&c.health>=1)s.status='survived';
  else{s.status='collapsed';s.cause='The colony reached round 20 without the required oxygen and medicine reserves.';}
 }
 if(s.market&&s.status!=='playing')s.market.offers={};
 const record={round,priority:priority(round),orders:boundOrders,receipts,colony:copy(c),merchants:copy(s.merchants),status:s.status,...s.market?{market:{offers:copy(s.market.offers),trades:copy(s.market.trades.filter(t=>t.round===round))}}:{}};s.history.push(record);
 if(s.status==='playing'){s.round=round+1;if(RELEASES.includes(s.round))s.depot.oxygen+=3;}
 return {state:s,record};
}
export function chooseNPC(s,seat='NPC',pending={}){
 const market=marketNPCDecision(s,seat);if(market&&previewOrder(s,seat,market.order).accepted)return market.order;
 const p=s.merchants[seat],c=s.colony;
 if(p.location!=='depot'){
  const good=p.location==='clinic'?'medicine':p.cargo.oxygen?'oxygen':'fuel';
  return p.cargo[good]>0?{kind:'sell',good,amount:p.cargo[good]}:{kind:'travel',destination:'depot'};
 }
 for(const good of GOODS)if(p.cargo[good]>0)return {kind:'travel',destination:good==='medicine'?'clinic':'habitat'};
 const reserved=Object.entries(pending).reduce((n,[other,o])=>n+(other!==seat&&o.kind==='load'&&o.good==='oxygen'?o.amount:0),0);
 const available=Math.max(0,s.depot.oxygen-reserved);
 if(s.round>1&&c.oxygen<=4&&available>0){const o={kind:'load',good:'oxygen',amount:Math.min(3,available),refill:2-p.tank};if(previewOrder(s,seat,o).accepted)return o;}
 if(c.medicine===0&&c.medicine_bought<3){const o={kind:'load',good:'medicine',amount:1,refill:2-p.tank};if(previewOrder(s,seat,o).accepted)return o;}
 return {...WAIT};
}
export function npcReason(s,pending={}){const market=marketNPCDecision(s,'NPC');if(market&&previewOrder(s,'NPC',market.order).accepted)return market.reason;const o=chooseNPC(s,'NPC',pending);return o.kind==='load'?`Buying ${o.good} to meet colony demand.`:o.kind==='travel'?'Moving cargo along my delivery route.':o.kind==='sell'?'Delivering cargo within district storage and procurement limits.':'No feasible trade meets my current policy.';}
export function describe(o){if(!o||o.kind==='wait')return 'Wait';if(o.kind==='cancel')return 'Cancel my offer';if(o.kind==='list')return `Offer ${o.amount} ${o.good} at ${o.unit_price} credits each`;if(o.kind==='buy')return `Buy ${o.amount} ${o.good} from ${o.seller} at ${o.unit_price} each`;if(o.kind==='load')return `Load ${o.amount} ${o.good}${o.refill?` + ${o.refill} tank fuel`:''}`;if(o.kind==='travel')return `Travel to ${o.destination}`;return `Sell ${o.amount} ${o.good}`;}
