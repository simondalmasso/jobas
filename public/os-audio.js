export const SOUND_KEY="jobas:sound:v1";
const patterns={
  key:[[1180,.018,"square",.018]],
  boot:[[523,.07,"square",.035],[784,.11,"square",.035]],
  success:[[660,.06,"square",.025],[990,.08,"square",.025]],
  error:[[155,.12,"sawtooth",.028],[105,.18,"sawtooth",.028]]
};

export function createAudio({storage=globalThis.localStorage,AudioCtx=globalThis.AudioContext||globalThis.webkitAudioContext}={}){
  let enabled=true,ctx=null;
  try{enabled=storage?.getItem(SOUND_KEY)!=="off";}catch{}
  const listeners=new Set();
  const notify=()=>listeners.forEach(fn=>{try{fn(enabled)}catch{}});
  const api={
    isEnabled:()=>enabled,
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    setEnabled(value){
      enabled=Boolean(value);
      try{storage?.setItem(SOUND_KEY,enabled?"on":"off");}catch{}
      if(enabled)api.unlock();
      notify();
      return enabled;
    },
    toggle(){return api.setEnabled(!enabled);},
    unlock(){
      if(!enabled||!AudioCtx)return false;
      try{
        if(!ctx)ctx=new AudioCtx();
        if(ctx.state==="suspended")ctx.resume?.();
        return ctx.state!=="closed";
      }catch{return false;}
    },
    play(name){
      const pattern=patterns[name];
      if(!enabled||!pattern||!ctx)return false;
      try{
        const start=ctx.currentTime;
        for(const [freq,dur,type,vol] of pattern){
          const osc=ctx.createOscillator(),gain=ctx.createGain();
          osc.type=type; osc.frequency.value=freq;
          gain.gain.setValueAtTime(.0001,start);
          gain.gain.linearRampToValueAtTime(vol,start+.004);
          gain.gain.exponentialRampToValueAtTime(.0001,start+dur);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(start); osc.stop(start+dur+.02);
        }
        return true;
      }catch{return false;}
    }
  };
  return api;
}

export function bindAudioUnlock(audio,target=globalThis.document){
  if(!target?.addEventListener)return()=>{};
  const events=["pointerdown","keydown","touchend"];
  const handler=()=>{
    if(audio.unlock())events.forEach(type=>target.removeEventListener(type,handler,true));
  };
  events.forEach(type=>target.addEventListener(type,handler,true));
  return()=>events.forEach(type=>target.removeEventListener(type,handler,true));
}
