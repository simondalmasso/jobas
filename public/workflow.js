const EXPLICIT_MODES=new Set(["cv","direct","platform"]);

function explicitMode(job){
  const raw=String(job?.applicationMode||job?.application?.mode||"").trim().toLowerCase();
  if(EXPLICIT_MODES.has(raw))return raw;
  if(["chat","conversation","microjob"].includes(raw))return"direct";
  if(["marketplace","proposal"].includes(raw))return"platform";
  if(["ats","traditional"].includes(raw))return"cv";
  return"";
}

function sourceText(job){
  return[
    job?.source,
    job?.sourceName,
    job?.sourceUrl,
    job?.sourceDetail,
    job?.url,
    job?.applyUrl
  ].filter(Boolean).join(" ").toLowerCase();
}

export function resolveApplicationMode(job){
  const explicit=explicitMode(job);
  if(explicit)return explicit;
  const text=sourceText(job);
  if(/\btelegram\b|(?:^|\W)t\.me\/|web\.telegram\.org/.test(text))return"direct";
  if(/\bworkana\b|\bupwork\b|freelancer\.com|\bfiverr\b|peopleperhour|contra\.com|guru\.com/.test(text))return"platform";
  return"cv";
}

export function applicationWorkflow(job,inProgress=false){
  const mode=resolveApplicationMode(job);
  if(mode==="cv"){
    return{
      mode,
      requiresCv:true,
      progressLabel:inProgress?"EN CURSO ✓":"EN CURSO",
      linkLabel:"Aplicar ↗"
    };
  }
  return{
    mode,
    requiresCv:false,
    progressLabel:inProgress?"ESPERANDO RESPUESTA ✓":"POSTULÉ / CONTACTÉ",
    linkLabel:inProgress?"CHEQUEAR RESPUESTA ↗":"POSTULAR / CONTACTAR ↗"
  };
}
