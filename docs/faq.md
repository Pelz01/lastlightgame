# Last Light — how to play

**Version 0.3.** Player guide for the hosted game. This file and the website FAQ are generated from `data/faq.json`.

The current market rules live in [economy-v0.3.md](economy-v0.3.md); underlying colony rules and the original critical round sequence remain in [economy-v0.2.md](economy-v0.2.md).

## Start here

### 1. How do I win?

Keep the colony alive through round 20, then finish with the highest score. You earn credits by delivering supplies or trading with other merchants. If the colony collapses, everyone loses—even the richest merchant.

### 2. What should I do first?

At the Depot, choose Load: buy 3 oxygen and add 2 tank fuel. This costs 8 credits. In the next round, Travel to the Habitat. Then choose Sell to deliver the oxygen. Travelling and selling are separate moves.

### 3. Can I learn without a wallet or timer?

Yes. Choose Play solo. Suggested moves are on and the clock is off by default. Two computer-controlled merchants play alongside you. In solo options, turn off Suggested moves to choose your own route, or turn on 15-second rounds for a faster match.

### 4. How long is a match?

There are 20 rounds. Online, each round gives you 15 seconds to choose one move—about five minutes of decision time, plus time for online confirmations. Solo play has no timer unless you switch it on.

### 5. Can I control both players?

Choose Play both sides. You control merchants A and B in one browser. Save a move for each, then choose Finish round. You can change either move before finishing. Tess, the computer-controlled third merchant, still chooses her own moves.

## Play with a friend

### 6. How do we start an online match?

Both players need different NEAR testnet wallets with test NEAR. Choose Play online and connect. One player chooses Create match and shares the invite or match code. The other chooses Join match. Enable fast actions, then choose Ready to play in both browsers. Tess joins automatically.

### 7. Do I need real money?

Solo play and Play both sides need no wallet. Online play uses free test NEAR, not purchased mainnet NEAR. Creating a match costs 0.5 test NEAR for storage, which is not refunded, plus network fees. Joining and making moves use network fees. Game credits have no cash value. Use Get test NEAR on the online-play screen.

### 8. What are fast actions?

Fast actions let this browser send game moves without a wallet popup for every turn. You approve a key limited to four game actions on Last Light, with up to 0.25 test NEAR for network fees. It cannot transfer your NEAR. Choose Disable fast actions to remove it. Clearing browser data alone does not remove that permission.

### 9. Does the host need to keep their computer on?

The website and Tess run on hosted services. The person who shares the link does not need to keep their computer on. During a match, keep your game tabs open. If both players leave, the round waits until someone returns to finish it.

### 10. What if I disconnect or miss the timer?

Reconnect with the same wallet and match code. Completed trades stay recorded. A saved move can still finish while you are away. If you did not save a move before the timer ended, your merchant waits that round. The colony still uses supplies when the round finishes.

## Choose your move

### 11. What does each action do?

Load buys cargo and tank fuel at the Depot. Travel moves your rover to another building. Sell delivers cargo at your destination. Market offers cargo to another merchant or buys their offer. Wait keeps your rover in place. Each uses one round; loading or buying can include a tank refill.

### 12. What does “Move saved” mean?

Your move is recorded for this round, but the trade has not happened yet. You can update it before the timer ends. At the end of the round, the game checks all moves in turn. Read Round complete or Move not completed to see the result.

### 13. How much can my rover carry?

Cargo has 6 spaces. One oxygen uses 2 spaces; one medicine or cargo fuel uses 1. That means a full oxygen load is 3 units. Your separate fuel tank holds 2 fuel and does not use cargo space.

### 14. How do routes and tank fuel work?

Each trip uses one round and 1 tank fuel. Leave the Depot with 2 tank fuel: one for the trip out and one for the return. Trips between the Habitat and Clinic go through the Depot. Refill your tank there. Your rover arrives when the round ends; choose Sell in a later round to deliver.

### 15. How do I trade with another merchant?

Both rovers must be at the Depot. Choose Market, select cargo and set a price per unit, then Post offer. Buyers can choose Buy lot from the next round. The whole displayed lot trades at once. If the offer changes before the purchase is processed, nothing moves. Changing or cancelling an offer uses a move. Leaving the Depot withdraws it.

### 16. Why did my payout change or my move fail?

The preview is an estimate. Other merchants may buy the last stock, deliver first, or fill a building’s storage. The move order is shown on the board and rotates each round. Oxygen and medicine sales can accept fewer units than requested. Set Minimum payout to the lowest total credits you will accept; if the offer falls below it, you keep all your cargo.

## Keep the colony alive

### 17. What happens when oxygen runs out?

The Habitat uses 1 oxygen at the end of each round. When stock reaches zero, you get one final rescue round. Sell oxygen at the Habitat, or sell cargo fuel to its plant, before that round ends. Travelling there alone does not deliver anything. If no oxygen arrives in time, everyone loses.

### 18. When does the Clinic need medicine?

The Clinic uses 1 medicine at the end of rounds 6, 12 and 18. A missed dose costs 1 health. It starts with 2 health; reaching zero ends the match. Later medicine prevents another missed dose but does not restore health. The Clinic stores up to 2 medicine and buys at most 3 delivered medicine per match.

### 19. What is the oxygen plant for?

The plant is part of the Habitat. Sell cargo fuel there to make oxygen: 1 fuel makes 2 oxygen and pays 4 credits. It can use only 3 fuel during the whole match. All the oxygen must fit in storage and the remaining delivery allowance. Tank fuel cannot be sold.

### 20. When do new supplies arrive?

The Depot gets 3 oxygen at the start of rounds 1, 4, 7, 10, 13 and 16. Its 4 medicine and 24 fuel must last the whole match. The Habitat stores up to 7 oxygen. The colony accepts up to 18 extra oxygen per match, counting both delivered oxygen and oxygen made by the plant.

### 21. What must remain at the end?

After round 20 uses its supplies, the Habitat needs at least 2 oxygen, the Clinic needs at least 1 medicine, and clinic health must be above zero. If any requirement is missed, everyone loses. The colony’s remaining credits are its budget for buying deliveries, not your score.

## Scores and saved games

### 22. How is my score calculated?

Your score is final credits plus the value of unsold cargo, minus your starting 25 credits. Each unsold oxygen or medicine is worth 1 credit. Every pair of cargo fuel is worth 1 credit; tank fuel is worth nothing. Highest score wins if the colony survives. Equal highest scores share the win.

### 23. Who is Tess?

Tess is a computer-controlled merchant who follows trading rules. She buys supplies, considers profitable cargo offers and makes deliveries. She has the same cargo and travel limits as you. Online, she signs moves with her own testnet wallet. If her move does not arrive before the timer ends, she waits.

### 24. Is my cargo secret?

The board hides rival cargo, but online match data and saved moves are public on NEAR. Match history and downloaded replays may also reveal cargo and actions. Plan around limited information on the board; do not rely on secrecy.

### 25. Does my match save?

Solo and Play both sides save in this browser. Use Continue practice or Continue pass & play on the home screen. Clearing browser data removes those saves. Online matches are recorded on NEAR: reconnect with the same wallet and match code. Download a replay from Match history if you want a copy.
