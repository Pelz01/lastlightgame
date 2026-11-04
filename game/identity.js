export const DEFAULT_IDENTITIES={A:{name:'Mara Vale',portrait:'mara'},B:{name:'Ilan Rook',portrait:'ilan'},NPC:{name:'Tess Calder',portrait:'tess'}};
export function cleanIdentity(input={},seat='A'){
 if(!input||typeof input!=='object')input={};
 const fallback=DEFAULT_IDENTITIES[seat]||DEFAULT_IDENTITIES.A;
 const name=typeof input.name==='string'?input.name.normalize('NFKC').replace(/[\p{C}<>]/gu,'').trim().replace(/\s+/g,' ').slice(0,24):'';
 return {name:name||fallback.name,portrait:seat==='NPC'?'tess':['mara','ilan'].includes(input.portrait)?input.portrait:fallback.portrait};
}
