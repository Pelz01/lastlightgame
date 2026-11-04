// Original procedural UI cues; no downloaded audio payload. Never auto-play.
let context, enabled = false;
export const cueNames = ['select','confirm','included','settled','rejected','critical','survived','collapse'];
export function setSoundEnabled(value) { enabled=Boolean(value); }
export async function playCue(name) {
 if(!enabled || !cueNames.includes(name)) return;
 const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
 if(!Audio) return;
 context ||= new Audio();
 if(context.state==='suspended') await context.resume();
 if(context.state!=='running') return;
 const notes={select:[480],confirm:[380,570],included:[420,480],settled:[420,630,840],rejected:[240,180],critical:[320,240],survived:[420,530,630,840],collapse:[320,240,160]}[name];
 notes.forEach((hz,i)=>{const o=context.createOscillator(),g=context.createGain(),t=context.currentTime+i*.09;o.type='sine';o.frequency.setValueAtTime(hz,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.035,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.12);o.connect(g).connect(context.destination);o.start(t);o.stop(t+.14);});
}
