import {GOODS,PRICE,VOLUME,volume} from './goods.js';
export const createMarket=()=>({offers:{},versions:{A:0,B:0,NPC:0},trades:[]});
export const lockedCargo=(s,seat,good)=>s.market?.offers[seat]?.good===good?s.market.offers[seat].amount:0;
export function cancelOffer(s,seat){if(s.market)delete s.market.offers[seat];}
export function normalizeMarketOrder(raw){
 const {kind,good,amount,unit_price,seller,offer_version,refill=0}=raw;
 if(kind==='cancel')return {kind};
 if(!GOODS.includes(good)||!Number.isSafeInteger(amount)||amount<1||amount>6||!Number.isSafeInteger(unit_price)||unit_price<1||unit_price>25)throw Error('Choose a whole lot and a unit price from 1 to 25');
 if(kind==='list')return {kind,good,amount,unit_price};
 if(!['A','B','NPC'].includes(seller)||!Number.isSafeInteger(offer_version)||offer_version<1||offer_version>1000)throw Error('Choose an existing offer and its version');
 return {kind,good,amount,unit_price,seller,offer_version,refill};
}
export function executeMarket(s,seat,o,accept,reject){
 if(!s.market)return reject('Merchant trading is not enabled in this match');
 const p=s.merchants[seat];if(p.location!=='depot')return reject('Merchant trading is available only at the depot');
 if(o.kind==='cancel'){if(!s.market.offers[seat])return reject('No offer to cancel');cancelOffer(s,seat);return accept('Offer cancelled');}
 if(o.kind==='list'){
  if(p.cargo[o.good]<o.amount)return reject('Not enough owned cargo for this lot');
  const version=++s.market.versions[seat];s.market.offers[seat]={seller:seat,version,good:o.good,amount:o.amount,unit_price:o.unit_price,created_round:s.round};
  return accept('Offer listed; cargo stays yours and occupies your hold');
 }
 if(o.seller===seat)return reject('You cannot buy your own offer');
 const offer=s.market.offers[o.seller],seller=s.merchants[o.seller];
 if(!offer||offer.version!==o.offer_version||offer.good!==o.good||offer.amount!==o.amount||offer.unit_price!==o.unit_price)return reject('Offer changed or was withdrawn; nothing transferred');
 if(offer.created_round>=s.round)return reject('An offer can be bought only from a later round');
 if(seller.location!=='depot'||seller.cargo[o.good]<o.amount)return reject('Seller or cargo is no longer available');
 if(volume(p)+o.amount*VOLUME[o.good]>6||p.tank+o.refill>2||(o.good==='oxygen'&&p.cargo.oxygen+o.amount>3))return reject('Cargo or tank capacity exceeded');
 if(s.depot.fuel<o.refill)return reject('Not enough depot stock for the tank refill');
 const price=o.amount*o.unit_price,cost=price+o.refill;if(p.cash<cost)return reject('Not enough credits for the lot and refill');
 // Every check precedes mutation. Goods and credits move together; only tank fuel is a sink.
 p.cash-=cost;seller.cash+=price;p.cargo[o.good]+=o.amount;seller.cargo[o.good]-=o.amount;p.tank+=o.refill;s.depot.fuel-=o.refill;s.depot_revenue+=o.refill;cancelOffer(s,o.seller);
 s.market.trades.push({round:s.round,seller:o.seller,buyer:seat,good:o.good,amount:o.amount,unit_price:o.unit_price,total:price});
 return accept('Merchant trade settled',{filled:o.amount,cost});
}
// A conservative stock-based estimate, not a guaranteed future district payout.
export function resaleEstimate(s,good,amount){
 const c=s.colony;if(good==='fuel'){const fill=Math.min(amount,3-c.plant_fuel_used,Math.floor(c.quota/2),Math.floor((7-Math.max(0,c.oxygen-2))/2));return fill===amount?fill*4:0;}
 const stock=good==='oxygen'?Math.max(0,c.oxygen-2):c.medicine;
 const fill=Math.min(amount,(good==='oxygen'?7:2)-stock,good==='oxygen'?c.quota:3-c.medicine_bought);
 return Array.from({length:Math.max(0,fill)},(_,i)=>good==='oxygen'?Math.max(4,8-stock-i):stock+i===0?8:5).reduce((a,b)=>a+b,0);
}
export function marketNPCDecision(s,seat){
 if(!s.market||s.merchants[seat].location!=='depot')return null;
 const p=s.merchants[seat],active=s.market.offers[seat],c=s.colony;
 if(active){
  if(s.round-active.created_round<2&&c.oxygen>2)return {order:{kind:'wait'},reason:'Giving other merchants two rounds to buy my lot.'};
  if(p.tank<2)return {order:{kind:'load',good:active.good,amount:0,refill:2-p.tank},reason:'Refuelling to deliver my unsold cargo myself.'};
  return {order:{kind:'travel',destination:active.good==='medicine'?'clinic':'habitat'},reason:'My offer did not clear; I am delivering it myself.'};
 }
 const offers=Object.values(s.market.offers).filter(o=>o.seller!==seat&&o.created_round<s.round).sort((a,b)=>a.amount*a.unit_price-b.amount*b.unit_price||a.seller.localeCompare(b.seller));
 for(const o of offers){
  const margin=resaleEstimate(s,o.good,o.amount)-o.amount*o.unit_price-2;
  if(margin<2||p.cash<o.amount*o.unit_price+2-p.tank||volume(p)+o.amount*VOLUME[o.good]>6||(o.good==='oxygen'&&p.cargo.oxygen+o.amount>3))continue;
  if((o.good==='oxygen'||o.good==='fuel')&&c.quota===0)continue;
  return {order:{kind:'buy',seller:o.seller,offer_version:o.version,good:o.good,amount:o.amount,unit_price:o.unit_price,refill:2-p.tank},reason:`This ${o.good} lot leaves an estimated ${margin}-credit margin after travel fuel.`};
 }
 const good=GOODS.find(g=>p.cargo[g]>0);if(!good)return null;
 const slack=good==='medicine'?c.medicine>0&&(![6,12,18].find(r=>r>=s.round)||[6,12,18].find(r=>r>=s.round)-s.round>=4):c.oxygen>=5;
 const amount=p.cargo[good],price=Math.min(PRICE[good]+1,Math.floor((resaleEstimate(s,good,amount)-4)/amount));
 if(slack&&price>=1&&s.round<=15&&['A','B'].some(other=>other!==seat&&s.merchants[other].location==='depot'&&volume(s.merchants[other])+amount*VOLUME[good]<=6&&s.merchants[other].cash>=amount*price+2-s.merchants[other].tank))return {order:{kind:'list',good,amount,unit_price:price},reason:'Supplies are stable; I am offering my cargo with room for a buyer’s delivery margin.'};
 return null;
}
