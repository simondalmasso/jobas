export const BAD_COMMAND="Bad command or file name";
export const DIRS=["REMOTO","LOCAL","CURSO","PROSPECTOS"];

export function parseCommand(input=""){
  const raw=String(input).trim();
  if(!raw)return null;
  const first=raw.search(/\s/);
  const name=(first<0?raw:raw.slice(0,first)).toUpperCase();
  let args=first<0?"":raw.slice(first).trim();
  if(args.length>=2&&args.startsWith('"')&&args.endsWith('"'))args=args.slice(1,-1);
  return{name,args,raw};
}

const line=(text,kind="out")=>({text,kind});

export function listCommands(){
  return[
    ["HELP","listar comandos"],
    ["DIR","ver directorios virtuales"],
    ["REMOTO / LOCAL / CURSO / PROSPECTOS","cambiar vista"],
    ["FIND <texto>","buscar oportunidades"],
    ["STATUS","estado real del feed"],
    ["FUENTES","abrir fuentes"],
    ["RESET","limpiar filtros"],
    ["CLS","limpiar consola"],
    ["MUTE / SOUND [ON|OFF]","sonido"],
    ["REBOOT","reiniciar JOBAS OS"]
  ];
}

export async function executeCommand(input,ctx={}){
  const p=parseCommand(input);
  if(!p)return{ok:true,lines:[]};
  const out=(...xs)=>({ok:true,lines:xs.map(x=>typeof x==="string"?line(x):x)});
  if(p.name==="HELP"||p.name==="?")return out(...listCommands().map(([a,b])=>line(a.padEnd(31)+b)));
  if(p.name==="DIR"){
    const s=ctx.snapshot?.()||{};
    const counts=s.counts||{};
    return out(" Volume in drive C is JOBAS"," Directory of C:\\JOBAS","",...DIRS.map(d=>line(d.padEnd(14)+"<DIR>   "+(counts[d==="CURSO"?"progress":d.toLowerCase()]??0))));
  }
  const modeMap={REMOTO:"remote",LOCAL:"local",CURSO:"progress",PROSPECTOS:"prospects"};
  if(modeMap[p.name]){ctx.setMode?.(modeMap[p.name]);return out("Vista "+p.name);}
  if(p.name==="CD"){
    const target=p.args.replace(/^\\?/,"").toUpperCase();
    if(modeMap[target]){ctx.setMode?.(modeMap[target]);return out("C:\\JOBAS\\"+target);}
    return{ok:false,lines:[line("The system cannot find the path specified.","error")]};
  }
  if(p.name==="FIND"){
    if(!p.args)return{ok:false,lines:[line("Usage: FIND <texto>","error")]};
    const r=ctx.find?.(p.args)||{count:0,mode:"remote"};
    return out('"'+p.args+'" -> '+r.count+" resultado(s) en "+String(r.mode||"").toUpperCase());
  }
  if(p.name==="STATUS"){
    const s=ctx.snapshot?.()||{};
    if(s.error)return{ok:false,lines:[line("Feed ERROR · "+s.error,"error")]};
    if(!s.loaded)return out("Feed CARGANDO");
    const f=s.feed||{},health=f.health||[];
    const healthy=health.filter(x=>x.state==="healthy").length;
    return out("Feed OK · "+(f.jobsCount??0)+" oportunidades","Fuentes "+healthy+"/"+health.length+" healthy","Vista "+String(s.mode||"").toUpperCase()+" · visibles "+(s.visible??0),"Sonido "+(ctx.sound?.isEnabled?.()?"ON":"OFF"));
  }
  if(p.name==="FUENTES"){ctx.openSources?.();return out("Fuentes abiertas");}
  if(p.name==="RESET"){ctx.resetFilters?.();return out("Filtros restaurados");}
  if(p.name==="CLS")return{ok:true,clear:true,lines:[]};
  if(p.name==="MUTE"){ctx.sound?.setEnabled?.(false);return out("Sound OFF");}
  if(p.name==="SOUND"){
    const arg=p.args.toUpperCase();
    if(arg==="ON")ctx.sound?.setEnabled?.(true);
    else if(arg==="OFF")ctx.sound?.setEnabled?.(false);
    else ctx.sound?.toggle?.();
    return out("Sound "+(ctx.sound?.isEnabled?.()?"ON":"OFF"));
  }
  if(p.name==="REBOOT"){ctx.reboot?.();return out("Rebooting JOBAS...");}
  return{ok:false,lines:[line(BAD_COMMAND,"error")]};
}
