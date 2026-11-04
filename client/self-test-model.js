import {chooseNPC,settleRound,copy} from '../game/rules.js';
export function settleBoth(game,pending){
 if(!pending.A||!pending.B)throw Error('Submit a move for both merchants before settling.');
 const orders={A:copy(pending.A),B:copy(pending.B)};
 orders.NPC=chooseNPC(game,'NPC',orders);
 return settleRound(game,orders);
}
