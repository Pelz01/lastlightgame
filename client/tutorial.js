import {icon} from './icons.js';
const preference='last-light-hide-intro-v1',seen='last-light-intro-seen-v1';
let active=null,acknowledged=false;
function stored(store,key){try{return window[store].getItem(key)==='yes';}catch{return false;}}
export function beforePlay(options={}){
 if(acknowledged||stored('localStorage',preference)||stored('sessionStorage',seen))return Promise.resolve(true);
 return showHowToPlay({...options,intro:true});
}
export function showHowToPlay({intro=false,online=false,soundEnabled=()=>false,onSound=()=>{}}={}){
 if(active)return active;
 active=new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='how-to-dialog';dialog.setAttribute('aria-labelledby','how-to-title');dialog.setAttribute('aria-describedby','how-to-goal');let accepted=false,hideNext=false;
  dialog.innerHTML=`<div class="how-to-top"><p class="eyebrow">${intro?'BEFORE YOU PLAY':'QUICK RULES'}</p><button type="button" class="icon-button" data-tutorial-close aria-label="${intro?'Back to play options':'Close quick rules'}">${icon('close')}</button></div><h2 id="how-to-title" tabindex="-1">Keep the lights on.<br>Finish richest.</h2><p id="how-to-goal">You’re a merchant with a cargo rover. Keep the colony alive for 20 rounds, then finish with the highest score.</p><ol class="how-to-steps"><li><span>${icon('depot')}</span><div><h3>1. Load up</h3><p>At the Depot, buy 3 oxygen and add 2 tank fuel. Your first load costs 8 credits.</p></div></li><li><span>${icon('travel')}</span><div><h3>2. Pick a destination</h3><p>Take oxygen and cargo fuel to the Habitat. Take medicine to the Clinic. One trip uses one move.</p></div></li><li><span>${icon('credits')}</span><div><h3>3. Sell after you arrive</h3><p>Choose Sell to make a delivery and earn credits. Travelling alone does not deliver your cargo.</p></div></li></ol><div class="how-to-survival"><b>Watch the colony’s supplies.</b><p>Oxygen runs down every round. Zero gives you one last rescue round. The Clinic uses medicine in rounds 6, 12 and 18.</p><p>Finish round 20 with at least 2 oxygen, 1 medicine and clinic health above zero. If the colony collapses, everyone loses.</p></div><p class="how-to-mode">${online?intro?'Online: you have 15 seconds to save each move. Your rover arrives when the round settles; selling takes a separate move.':'Online rounds keep running while these rules are open.':intro?'Solo has no timer by default. Suggested moves help you learn the first route.':'Loading, travelling and selling are separate moves. Check your cargo and tank fuel before confirming.'}</p><div class="how-to-options">${intro?'<button type="button" class="text-button how-to-hide" data-tutorial-hide aria-pressed="false"><span aria-hidden="true">□</span> Don’t show this again</button>':''}<button type="button" class="text-button" data-tutorial-sound>${soundEnabled()?'Sound on':'Enable sound'}</button></div><button type="button" class="button primary how-to-continue" data-tutorial-continue>${intro?online?'Continue to online play':'Let’s play':'Back to game'} ${icon('arrow')}</button>`;
  const scroll=document.createElement('div'),footer=document.createElement('div'),previousFocus=document.activeElement;scroll.className='how-to-scroll';footer.className='how-to-footer';
  while(dialog.firstElementChild&&!dialog.firstElementChild.classList.contains('how-to-options'))scroll.append(dialog.firstElementChild);
  while(dialog.firstChild)footer.append(dialog.firstChild);dialog.append(scroll,footer);
  dialog.addEventListener('click',async event=>{
   const button=event.target.closest('button');if(!button)return;
   if(button.hasAttribute('data-tutorial-close'))dialog.close();
   if(button.hasAttribute('data-tutorial-hide')){hideNext=!hideNext;button.setAttribute('aria-pressed',String(hideNext));button.querySelector('span').textContent=hideNext?'☑':'□';}
   if(button.hasAttribute('data-tutorial-sound')){await onSound();button.textContent=soundEnabled()?'Sound on':'Enable sound';}
   if(button.hasAttribute('data-tutorial-continue')){accepted=true;if(intro){acknowledged=true;try{sessionStorage.setItem(seen,'yes');if(hideNext)localStorage.setItem(preference,'yes');}catch{}}dialog.close();}
  });
  dialog.addEventListener('close',()=>{dialog.remove();document.documentElement.classList.remove('rules-open');active=null;(previousFocus?.isConnected?previousFocus:document.querySelector('[data-do=help]'))?.focus({preventScroll:true});resolve(accepted);},{once:true});
  document.body.append(dialog);document.documentElement.classList.add('rules-open');dialog.showModal();dialog.querySelector('h2').focus({preventScroll:true});
 });
 return active;
}
