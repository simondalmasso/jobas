function tokens(values=[]){
  return (Array.isArray(values)?values:[values])
    .flatMap(v=>String(v||"").toLowerCase().split(/[^a-záéíóúüñ0-9+#.]+/i))
    .map(x=>x.trim())
    .filter(x=>x.length>=3);
}

export function personalFitScore(job,profile={}){
  const text=[job?.title,job?.company,job?.description,job?.category,...(job?.tags||[])]
    .filter(Boolean).join(" ").toLowerCase();
  const roles=tokens(profile.targetRoles||[]);
  const skills=tokens(profile.skills||[]);
  const modes=new Set(profile.modes||[]);
  const local=String(job?.lane||"").toUpperCase()==="LOCAL";
  const modeCompatible=local?modes.has("local"):(modes.has("remote")||modes.has("microjobs"));
  const roleHits=roles.filter(t=>text.includes(t)).length;
  const skillHits=skills.filter(t=>text.includes(t)).length;
  const roleScore=roles.length?Math.min(45,Math.round(45*roleHits/Math.min(roles.length,3))):0;
  const skillScore=skills.length?Math.min(25,Math.round(25*skillHits/Math.min(skills.length,5))):0;
  const modeScore=modeCompatible?30:0;
  return Math.max(0,Math.min(100,modeScore+roleScore+skillScore));
}

export function sortByPersonalFit(jobs,profile){
  return [...jobs].sort((a,b)=>
    personalFitScore(b,profile)-personalFitScore(a,profile)||
    Number(b?.qualityScore||0)-Number(a?.qualityScore||0)
  );
}
