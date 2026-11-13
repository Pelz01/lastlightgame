// Original procedural UI cues; no downloaded audio payload. Never auto-play.
let context, master, enabled = false;
export const cueNames = ['select','confirm','included','settled','rejected','critical','survived','collapse'];
export function setSoundEnabled(value) { enabled=Boolean(value);if(master)master.gain.setValueAtTime(enabled?1:0,context.currentTime); }
export function getSoundState(){return {enabled,state:context?.state||'not-started'};}
export async function unlockAudio(){
 const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;
 if(!context){context=new Audio();master=context.createGain();master.gain.value=enabled?1:0;master.connect(context.destination);}
 if(context.state==='suspended')await context.resume();return context.state==='running';
}
export async function playCue(name) {
 if(!enabled || !cueNames.includes(name)||!await unlockAudio()) return false;
 const notes={select:[480],confirm:[380,570],included:[420,480],settled:[420,630,840],rejected:[240,180],critical:[320,240],survived:[420,530,630,840],collapse:[320,240,160]}[name];
 notes.forEach((hz,i)=>{const o=context.createOscillator(),g=context.createGain(),t=context.currentTime+i*.09;o.type='sine';o.frequency.setValueAtTime(hz,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.16);o.connect(g).connect(master);o.start(t);o.stop(t+.18);});return true;
}
