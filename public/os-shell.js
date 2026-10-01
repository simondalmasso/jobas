import {executeCommand} from "./os-commands.js";

export const promptFor=mode=>({
  remote:"C:\\JOBAS\\REMOTO>",
  local:"C:\\JOBAS\\LOCAL>",
  progress:"C:\\JOBAS\\CURSO>",
  prospects:"C:\\JOBAS\\PROSPECTOS>"
}[mode]||"C:\\JOBAS>");

export function createHistory(limit=40){
  const items=[]; let index=0;
  return{
    push(v){v=String(v||"").trim();if(!v)return;if(items.at(-1)!==v)items.push(v);if(items.length>limit)items.shift();index=items.length;},
    prev(){if(!items.length)return null;index=Math.max(0,index-1);return items[index]??"";},
    next(){if(!items.length)return null;index=Math.min(items.length,index+1);return index===items.length?"":items[index]??"";}
  };
}

export function createShell({ctx,audio,doc=globalThis.document}={}){
  const form=doc?.querySelector("#termForm"),input=doc?.querySelector("#termInput"),out=doc?.querySelector("#termOut"),
        panel=doc?.querySelector("#term"),label=doc?.querySelector("#termLabel"),close=doc?.querySelector("#termClose");
  const history=createHistory();
  const write=(text,kind="out")=>{
    if(!out)return;
    const div=doc.createElement("div"); div.className="term-line "+kind; div.textContent=text; out.appendChild(div); out.scrollTop=out.scrollHeight;
  };
  const clear=()=>{if(out)out.textContent="";};
  const sync=()=>{if(label)label.textContent=promptFor(ctx.snapshot?.().mode);};
  const open=()=>{if(panel)panel.hidden=false;input?.focus();};
  const focus=()=>{open();input?.focus();};
  const closePanel=()=>{if(panel)panel.hidden=true;};
  form?.addEventListener("submit",async e=>{
    e.preventDefault(); const raw=input.value; if(!raw.trim())return;
    open(); write(promptFor(ctx.snapshot?.().mode)+" "+raw,"cmd"); history.push(raw); input.value="";
    const r=await executeCommand(raw,ctx);
    if(r.clear)clear();
    for(const l of r.lines||[])write(l.text,l.kind||"out");
    audio?.play?.(r.ok?"key":"error"); sync();
  });
  input?.addEventListener("keydown",e=>{
    if(e.key==="ArrowUp"){const v=history.prev();if(v!==null){e.preventDefault();input.value=v;input.setSelectionRange(v.length,v.length);}}
    if(e.key==="ArrowDown"){const v=history.next();if(v!==null){e.preventDefault();input.value=v;input.setSelectionRange(v.length,v.length);}}
    if(e.key==="Escape"){e.preventDefault();closePanel();}
  });
  close?.addEventListener("click",closePanel);
  return{focus,open,close:closePanel,clear,sync,write};
}
