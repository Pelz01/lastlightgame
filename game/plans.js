// The documented feasibility witness is also a disclosed guided-training plan.
const load=(good,amount)=>({kind:'load',good,amount,refill:2});
const travel=destination=>({kind:'travel',destination});
const sell=(good,amount)=>({kind:'sell',good,amount});
export const PLANS={
 A:{1:load('oxygen',3),2:travel('habitat'),3:sell('oxygen',3),4:travel('depot'),5:load('medicine',1),6:travel('clinic'),7:sell('medicine',1),8:travel('depot'),10:load('oxygen',3),11:travel('habitat'),12:sell('oxygen',3),13:travel('depot'),14:load('medicine',1),15:travel('clinic'),16:sell('medicine',1),17:travel('depot')},
 B:{4:load('oxygen',3),5:travel('habitat'),6:sell('oxygen',3),7:travel('depot'),8:load('medicine',1),9:travel('clinic'),10:sell('medicine',1),11:travel('depot'),13:load('oxygen',3),14:travel('habitat'),15:sell('oxygen',3),16:travel('depot')},
 NPC:{7:load('oxygen',3),8:travel('habitat'),9:sell('oxygen',3),10:travel('depot'),16:load('oxygen',3),17:travel('habitat'),18:sell('oxygen',3),19:travel('depot')}
};
