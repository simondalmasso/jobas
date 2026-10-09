import { sendCoachMessage } from "./coach.js";
const HF_CHAT="https://router.huggingface.co/v1/chat/completions";
const SESSION_KEY="jobas:hf:key:session";
const LOCAL_KEY="jobas:hf:key:local";

export function createPennyCredentialStore({sessionStorage=globalThis.sessionStorage,localStorage=globalThis.localStorage}={}){
  return{
    get(){try{return sessionStorage?.getItem(SESSION_KEY)||localStorage?.getItem(LOCAL_KEY)||"";}catch{return"";}},
    set(key,persist=false){
      this.clear();
      const value=String(key||"").trim();
      if(!value)return"";
      try{(persist?localStorage:sessionStorage)?.setItem(persist?LOCAL_KEY:SESSION_KEY,value);}catch{}
      return value;
    },
    clear(){
      try{sessionStorage?.removeItem(SESSION_KEY);}catch{}
      try{localStorage?.removeItem(LOCAL_KEY);}catch{}
    }
  };
}

export function buildPennySystemPrompt({profile={},jobs=[]}={}){
  const role=(profile.targetRoles||[]).join(", ")||"no definido";
  const modes=(profile.modes||[]).join(", ")||"no definidas";
  const skills=(profile.skills||[]).join(", ")||"no declaradas";
  const sample=jobs.slice(0,6).map(j=>`${j.title} — ${j.company}`).join(" | ")||"sin ofertas cargadas";
  return [
    "Sos Penny, la asistente de JOBAS. Sos una lapicera azul simpática, práctica y breve.",
    "Ayudás a la persona a orientarse dentro de JOBAS, pensar una búsqueda, preparar una postulación o una entrevista.",
    "No inventes experiencia, salarios, empresas ni oportunidades.",
    "Si preguntan por una oferta, basate solo en las ofertas provistas en contexto o pedí que abra Ofertas.",
    "No digas que aplicaste, contactaste o modificaste algo si no ocurrió.",
    `Objetivo laboral del usuario: ${role}`,
    `Modalidades: ${modes}`,
    `Skills declaradas: ${skills}`,
    `Ofertas visibles de referencia: ${sample}`
  ].join("\n");
}

export async function sendPennyMessage({token,provider="huggingface",model="openai/gpt-oss-120b:cheapest",messages,fetchImpl=globalThis.fetch}){
  if(provider==="openrouter"){
    // Share the user-authorized credential with Coach; fixed free router only.
    // Do not send requests to JOBAS Worker or silently fall back to billable models.
    return sendCoachMessage({apiKey:token,model:"openrouter/free",messages,fetchImpl});
  }
  if(provider!=="huggingface")throw new Error("UNKNOWN_AI_PROVIDER");
  if(!token)throw new Error("HF_NOT_CONNECTED");
  const r=await fetchImpl(HF_CHAT,{
    method:"POST",
    headers:{
      Authorization:`Bearer ${token}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({model,messages,temperature:.55,max_tokens:350})
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data?.error?.message||data?.error||`HF_${r.status}`);
  const content=data?.choices?.[0]?.message?.content;
  if(!content)throw new Error("HF_EMPTY_RESPONSE");
  return{content:String(content),raw:data};
}