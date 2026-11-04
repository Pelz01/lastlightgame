import {icon} from './icons.js';
import {DEFAULT_IDENTITIES} from '/game/identity.js';
import {fleetHTML} from './rover-scene.js';
export const colonyMessage=game=>{const c=game.colony,next=[6,12,18].find(r=>r>=game.round),record=game.history.at(-1);const fuel=record?Object.entries(record.orders).reduce((n,[seat,o])=>n+(o.kind==='sell'&&o.good==='fuel'&&record.receipts[seat].accepted?record.receipts[seat].filled:0),0):0;
 if(c.critical)return 'Habitat dispatch: oxygen empty. Sell oxygen or cargo fuel here before this round ends.';
 if(game.round>18&&c.medicine===0)return 'Clinic dispatch: final reserve missing. Sell at least 1 medicine here before round 20 ends.';
 if(c.health===1)return 'Clinic dispatch: emergency reserves. Another missed medicine dose ends the match.';
 if(fuel)return `Plant dispatch: ${fuel*2} oxygen produced at the end of last round.`;
 if(c.oxygen<=2)return 'Habitat dispatch: non-essential lighting reduced. Oxygen delivery needed.';
 if(c.medicine===0&&next)return `Clinic dispatch: medicine stores empty. Next dose due round ${next}.`;
 return 'Residents: life support stable. The next supply run still matters.';
};
export function worldHTML(game,you,selectedNode){const c=game.colony,record=game.history.at(-1);const plantFuel=record?Object.entries(record.orders).reduce((n,[s,o])=>n+(o.kind==='sell'&&o.good==='fuel'&&record.receipts[s].accepted?record.receipts[s].filled:0),0):0;
 const nodes=[['depot',`${game.depot.oxygen} oxygen available`],['habitat',c.critical?'CRITICAL · rescue now':`${c.oxygen} oxygen · ${c.oxygen<=2?'LOW SUPPLY':'online'}`],['clinic',`${c.medicine} medicine · ${c.health}/2 health`]];
 return `<section class="colony-board surface-world ${c.oxygen<=2?'oxygen-low':''} ${c.critical?'oxygen-critical':''} ${c.medicine===0||c.health<=1?'clinic-emergency':''} ${plantFuel?'plant-producing':''}" aria-label="Overhead ground colony map"><div class="ground-texture" aria-hidden="true"></div><div class="board-caption"><p class="eyebrow">COLONY MAP</p><span class="clinic-caption">Clinic ${c.health}/2 health · ${[6,12,18].find(r=>r>=game.round)?'next check R'+[6,12,18].find(r=>r>=game.round):'checks complete'}</span></div>
 <svg class="surface-roads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g class="road-edge"><path d="M29 52 H43 L56 38 H66"/><path d="M29 52 H43 L58 78 H69"/></g><g class="road-bed"><path d="M29 52 H43 L56 38 H66"/><path d="M29 52 H43 L58 78 H69"/></g><g class="road-center"><path d="M29 52 H43 L56 38 H66"/><path d="M29 52 H43 L58 78 H69"/></g><path class="annex-pipe" d="M74 26 H84"/></svg>
 ${nodes.map(([n,text])=>`<button class="map-node node-${n} ${selectedNode===n?'selected':''}" data-node="${n}" aria-label="${n}: ${text}"><span class="district ground-building ${n}"></span><span class="building-windows" aria-hidden="true"><i></i><i></i><i></i></span><span class="node-label">${icon(n)}${n[0].toUpperCase()+n.slice(1)}<small>${text}</small></span></button>`).join('')}
 <button class="plant-annex" data-plant="true" aria-label="Oxygen plant annex at habitat. ${plantFuel?plantFuel*2+' oxygen produced last round':'Sell cargo fuel at habitat'}"><span class="ground-building plant"></span><span class="plant-lamp" aria-hidden="true"></span><span class="annex-label">O₂ PLANT<small>${plantFuel?'+'+plantFuel*2+' oxygen · last round':'At the Habitat'}</small></span></button>
 <div class="residents" aria-hidden="true">${[[52,23],[56,24],[61,29],[72,21],[63,64],[70,65]].map(([x,y])=>`<i style="left:${x}%;top:${y}%"><b></b></i>`).join('')}</div>${fleetHTML(game,you)}<div class="resident-dispatch" role="status">${colonyMessage(game)}</div><div class="board-bottom"><span>DEPOT ↔ HABITAT / PLANT</span><span>DEPOT ↔ CLINIC</span></div></section>`;
}
