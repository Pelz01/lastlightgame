export const GOODS=['oxygen','medicine','fuel'];
export const PRICE={oxygen:2,medicine:2,fuel:1};
export const VOLUME={oxygen:2,medicine:1,fuel:1};
export const volume=p=>GOODS.reduce((n,g)=>n+p.cargo[g]*VOLUME[g],0);
