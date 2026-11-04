// Player-facing explanations; authoritative rules and stored receipts stay unchanged.
const receipts={
 'Loaded':'Purchase complete.',
 'Travelled':'Arrived at your destination.',
 'Sold':'Delivery complete.',
 'Waited':'Stayed in place.',
 'Offer cancelled':'Offer cancelled. Your cargo stays in your rover.',
 'Offer listed; cargo stays yours and occupies your hold':'Offer posted. The cargo stays in your rover until bought.',
 'Merchant trade settled':'Cargo bought. The seller received your credits.',
 'Loading is available only at the depot':'Return to the Depot to buy supplies or refill your tank.',
 'Choose cargo or a tank refill':'Choose some cargo or add tank fuel before confirming.',
 'Cargo or tank capacity exceeded':'Choose less cargo or tank fuel. Cargo has 6 spaces; the tank holds 2 fuel.',
 'At most three oxygen per merchant':'Your rover holds up to 3 oxygen. Choose a smaller load.',
 'Not enough depot stock':'The Depot does not have enough stock for this load. Choose a smaller amount or another good.',
 'Not enough credits':'You need more credits for this purchase. Reduce the amount or tank refill.',
 'Travel must go through the depot':'Travel to the Depot first, then choose your next destination.',
 'Not enough fuel for the trip and return':'Add tank fuel at the Depot. You need 2 fuel before leaving: one to go and one to return.',
 'Cargo must be sold at its district':'Sell oxygen or cargo fuel at the Habitat. Sell medicine at the Clinic.',
 'No selected cargo to sell':'You do not have this cargo. Choose a good in your rover.',
 'Plant conversion must fill entirely within storage, quota and lifetime cap':'Try less cargo fuel. All its oxygen must fit in storage and the delivery allowance; the plant can use only 3 fuel per match.',
 'No district storage or procurement quota remains':'This building is full or has reached its buying limit. Check its supplies before choosing another delivery.',
 'Payout fell below your minimum; cargo retained':'The payout is below your minimum. Cargo stays in your rover. Lower the minimum only if you accept a smaller payout.',
 'Treasury cannot cover the delivery':'The colony cannot afford this delivery. Try a smaller amount.',
 'Merchant trading is not enabled in this match':'This older match does not support merchant offers. Start a new match to use Market.',
 'Merchant trading is available only at the depot':'Return to the Depot to offer cargo or buy another merchant’s lot.',
 'No offer to cancel':'You have no active offer to cancel.',
 'Not enough owned cargo for this lot':'Offer only cargo that is already in your rover. Choose a smaller amount.',
 'You cannot buy your own offer':'Choose another merchant’s offer to buy, or cancel your own.',
 'Offer changed or was withdrawn; nothing transferred':'That offer changed or was cancelled. You kept your credits. Choose a current offer.',
 'An offer can be bought only from a later round':'This offer becomes available next round.',
 'Seller or cargo is no longer available':'The seller or their cargo is no longer at the Depot. Choose another offer.',
 'Not enough depot stock for the tank refill':'The Depot does not have enough fuel for this refill. Add less tank fuel.',
 'Not enough credits for the lot and refill':'You cannot afford this lot and refill together. Reduce the refill or choose another offer.'
};
export function receiptCopy(reason){return receipts[reason]||String(reason||'');}
export function actionLabel(order){return {load:'Buy & load',travel:'Travel to '+({depot:'Depot',habitat:'Habitat',clinic:'Clinic'}[order.destination]||'destination'),sell:'Sell cargo',list:'Post offer',buy:'Buy lot',cancel:'Cancel offer',wait:'Wait this round'}[order.kind]||'Confirm move';}
export const receiptLabel=status=>({included:'MOVE SAVED',settled:'ROUND COMPLETE',rejected:'MOVE NOT COMPLETED'}[status]||'PREVIEW');
export const transactionLabel=method=>({create_match:'Match created',join_match:'Match joined',ready_match:'Ready to play',submit_order:'Move saved',settle_round:'Round finished'}[method]||'View confirmation');
export function errorCopy(error){const text=String(error?.message||error||'');
 if(/stale or late|missed.*cutoff/i.test(text))return 'That move missed the timer. Choose a move for the current round; it was not carried over.';
 if(/both merchant seats|both seats|room is full/i.test(text))return 'Both player places are taken. Ask your friend for a new match code.';
 if(/match not found|unknown match/i.test(text))return 'We could not find that match. Check the six-character code and try again.';
 if(/does not own a merchant/i.test(text))return 'Connect the wallet you used to join this match, then reconnect.';
 if(/NotEnoughAllowance|allowance.*exceed/i.test(text))return 'Fast actions have used their fee allowance. Disable fast actions, then enable them again.';
 if(/NotEnoughBalance|insufficient.*balance|not enough.*balance/i.test(text))return 'Your wallet needs more test NEAR. Use Get test NEAR, then try again.';
 if(/InvalidNonce/i.test(text))return 'Your wallet is still syncing. Reconnect and check Match history before trying again.';
 if(/user.*reject|user.*cancel|request.*reject/i.test(text))return 'You cancelled the wallet request. No new move was saved.';
 if(/fetch|timeout|timed out|RPC unavailable|network error/i.test(text))return 'Connection interrupted. Reconnect to refresh the match before sending another move.';
 if(/[{}]|ExecutionError|InvalidTxError/.test(text))return 'We could not confirm this action. Check Match history before trying again.';
 return receiptCopy(text);
}
export function lossCopy(cause){return {
 'The final oxygen rescue window closed without a delivery.':'No oxygen arrived during the final rescue round. The colony ran out of air.',
 'The clinic missed two medicine deadlines.':'The Clinic missed two medicine doses and lost all its health.',
 'The colony reached round 20 without the required oxygen and medicine reserves.':'Round 20 ended without the required supplies: 2 oxygen, 1 medicine and clinic health above zero.'
}[cause]||cause;}
export function firstDeliveryHint(game,seat){const p=game.merchants[seat];
 if(game.round===1&&p.location==='depot')return 'First delivery: Load 3 oxygen and add 2 tank fuel. Total: 8 credits.';
 if(p.location==='depot'&&p.cargo.oxygen)return 'Next: Travel to the Habitat. Choose Sell after you arrive.';
 if(p.location==='depot'&&p.cargo.medicine)return 'Medicine goes to the Clinic. Travel first, then choose Sell.';
 if(p.location==='habitat'&&p.cargo.oxygen)return 'You have arrived. Choose Sell to deliver your oxygen and earn credits.';
 return 'Choose one move. Load buys supplies; Travel moves your rover; Sell makes the delivery.';
}
