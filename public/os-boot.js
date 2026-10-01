export const BOOT_LINES=[
  "JOBAS SYSTEM v1.0",
  "Memory check ........ OK",
  "Feed interface ...... READY",
  "Prospector .......... READY",
  "Loading JOBAS.EXE ... [##########]",
  "C:\\>JOBAS"
];

export function initBoot({audio,onDone=()=>{},doc=globalThis.document,win=globalThis.window}={}){
  const root=doc?.querySelector("#boot"),log=doc?.querySelector("#bootLog"),start=doc?.querySelector("#bootStart"),sound=doc?.querySelector("#bootSound");
  if(!root)return{restart(){}};
  const reduced=win?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  let running=false,timers=[];
  const clearTimers=()=>{timers.forEach(clearTimeout);timers=[];};
  const finish=(choice=null)=>{
    clearTimers(); root.dataset.state="done"; root.hidden=true; running=false; audio?.play?.("success"); onDone({choice});
  };
  const run=(choice=null)=>{
    if(running)return; running=true; audio?.unlock?.(); audio?.play?.("boot"); root.dataset.state="running"; if(log)log.textContent="";
    if(reduced){if(log)log.textContent=BOOT_LINES.join("\n");finish(choice);return;}
    BOOT_LINES.forEach((text,i)=>timers.push(setTimeout(()=>{if(log)log.textContent+=(i?"\n":"")+text;},i*115)));
    timers.push(setTimeout(()=>finish(choice),BOOT_LINES.length*115+180));
  };
  const restart=()=>{clearTimers();running=false;root.hidden=false;root.dataset.state="splash";if(log)log.textContent="";start?.focus();};
  root.addEventListener("click",e=>{const b=e.target.closest("[data-boot-mode]");run(b?.dataset.bootMode||null);});
  doc.addEventListener("keydown",e=>{
    if(root.hidden)return;
    if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
    if(running){finish();e.preventDefault();return;}
    const map={"1":"remote","2":"local","3":"progress","4":"prospects"};
    run(map[e.key]||null);e.preventDefault();
  },true);
  sound?.addEventListener("click",e=>{e.stopPropagation();audio?.toggle?.();});
  audio?.subscribe?.(on=>{for(const el of doc.querySelectorAll("[data-sound-state]"))el.textContent=on?"ON":"OFF";});
  restart();
  return{restart,finish};
}
