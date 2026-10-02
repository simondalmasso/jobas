const ORIGIN="https://openrouter.ai";
const CHAT_URL=ORIGIN+"/api/v1/chat/completions";
const KEY_EXCHANGE_URL=ORIGIN+"/api/v1/auth/keys";
const SESSION_KEY="jobas:openrouter:key:session";
const LOCAL_KEY="jobas:openrouter:key:local";
const VERIFIER_KEY="jobas:openrouter:pkce:verifier";
const STATE_KEY="jobas:openrouter:pkce:state";

const b64url=bytes=>{
  let binary="";
  for(const b of new Uint8Array(bytes))binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
};

export async function createPkcePair(cryptoImpl=globalThis.crypto){
  if(!cryptoImpl?.getRandomValues||!cryptoImpl?.subtle)throw new Error("PKCE_UNAVAILABLE");
  const seed=new Uint8Array(32);
  cryptoImpl.getRandomValues(seed);
  const verifier=b64url(seed);
  const hash=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(verifier));
  return{verifier,challenge:b64url(hash)};
}

export function buildOpenRouterAuthUrl({callbackUrl,challenge,state,keyLabel="JOBAS Coach"}){
  const u=new URL(ORIGIN+"/auth");
  u.searchParams.set("callback_url",callbackUrl);
  u.searchParams.set("code_challenge",challenge);
  u.searchParams.set("code_challenge_method","S256");
  u.searchParams.set("state",state);
  u.searchParams.set("key_label",keyLabel);
  return u.toString();
}

export function createCredentialStore({sessionStorage=globalThis.sessionStorage,localStorage=globalThis.localStorage}={}){
  return{
    get(){
      try{return sessionStorage?.getItem(SESSION_KEY)||localStorage?.getItem(LOCAL_KEY)||"";}catch{return"";}
    },
    set(key,persist=false){
      this.clear();
      if(!key)return"";
      try{(persist?localStorage:sessionStorage)?.setItem(persist?LOCAL_KEY:SESSION_KEY,key);}catch{}
      return key;
    },
    clear(){
      try{sessionStorage?.removeItem(SESSION_KEY);}catch{}
      try{localStorage?.removeItem(LOCAL_KEY);}catch{}
    }
  };
}

export async function startOpenRouterOAuth({
  callbackUrl=globalThis.location?.origin+globalThis.location?.pathname,
  sessionStorage=globalThis.sessionStorage,
  locationObj=globalThis.location,
  cryptoImpl=globalThis.crypto
}={}){
  const {verifier,challenge}=await createPkcePair(cryptoImpl);
  const stateBytes=new Uint8Array(18);
  cryptoImpl.getRandomValues(stateBytes);
  const state=b64url(stateBytes);
  sessionStorage?.setItem(VERIFIER_KEY,verifier);
  sessionStorage?.setItem(STATE_KEY,state);
  const url=buildOpenRouterAuthUrl({callbackUrl,challenge,state});
  if(locationObj)locationObj.href=url;
  return url;
}

export async function exchangeOpenRouterCode({code,verifier,fetchImpl=globalThis.fetch}){
  const r=await fetchImpl(KEY_EXCHANGE_URL,{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({code,code_verifier:verifier,code_challenge_method:"S256"})
  });
  if(!r.ok)throw new Error("OPENROUTER_AUTH_"+r.status);
  const data=await r.json();
  if(!data?.key)throw new Error("OPENROUTER_NO_KEY");
  return data.key;
}

export async function finishOpenRouterOAuth({
  url=globalThis.location?.href||"",
  sessionStorage=globalThis.sessionStorage,
  credentialStore=createCredentialStore(),
  fetchImpl=globalThis.fetch,
  historyObj=globalThis.history
}={}){
  const u=new URL(url);
  const code=u.searchParams.get("code");
  if(!code)return null;
  const returnedState=u.searchParams.get("state");
  const expectedState=sessionStorage?.getItem(STATE_KEY)||"";
  const verifier=sessionStorage?.getItem(VERIFIER_KEY)||"";
  if(!verifier||!expectedState||returnedState!==expectedState)throw new Error("OPENROUTER_STATE_MISMATCH");
  const key=await exchangeOpenRouterCode({code,verifier,fetchImpl});
  credentialStore.set(key,false);
  sessionStorage?.removeItem(VERIFIER_KEY);
  sessionStorage?.removeItem(STATE_KEY);
  u.searchParams.delete("code");
  u.searchParams.delete("state");
  historyObj?.replaceState?.({},"",u.pathname+u.search+u.hash);
  return key;
}

const jsonHeaders=key=>({
  Authorization:`Bearer ${key}`,
  "Content-Type":"application/json",
  "HTTP-Referer":globalThis.location?.origin||"https://jobas.web.app",
  "X-OpenRouter-Title":"JOBAS Interview Coach"
});

export async function sendCoachMessage({apiKey,model="openrouter/free",messages,fetchImpl=globalThis.fetch}){
  if(!apiKey)throw new Error("OPENROUTER_NOT_CONNECTED");
  const r=await fetchImpl(CHAT_URL,{
    method:"POST",
    headers:jsonHeaders(apiKey),
    body:JSON.stringify({model,messages,temperature:.65})
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data?.error?.message||`OPENROUTER_${r.status}`);
  const message=data?.choices?.[0]?.message||{};
  return{content:String(message.content||""),usage:data?.usage||null,raw:data};
}

export function buildInterviewSystemPrompt({profile={},job={}}={}){
  return [
    "Sos JOBAS Coach, un entrenador de entrevistas laborales.",
    "Tu trabajo es simular entrevistas, entrenar respuestas y dar feedback concreto.",
    "No inventes experiencia, logros, herramientas, idiomas ni métricas del candidato.",
    "Si falta información, preguntá o marcá el hueco.",
    "Sé exigente pero breve; priorizá claridad, evidencia y respuestas humanas.",
    `Candidato: ${profile.name||"Sin nombre"}`,
    `Objetivos: ${(profile.targetRoles||[]).join(", ")||"No definidos"}`,
    `Skills declaradas: ${(profile.skills||[]).join(", ")||"No declaradas"}`,
    `Idiomas: ${(profile.languages||[]).join(", ")||"No declarados"}`,
    `Puesto: ${job.title||"Entrevista general"}`,
    `Empresa: ${job.company||"No especificada"}`,
    `Descripción verificable disponible: ${job.description||"No disponible"}`
  ].join("\n");
}

function parseJsonObject(content){
  const raw=String(content||"").trim().replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
  const a=raw.indexOf("{"), b=raw.lastIndexOf("}");
  if(a<0||b<a)throw new Error("PROFILE_JSON_INVALID");
  return JSON.parse(raw.slice(a,b+1));
}

export async function extractProfileFromCv({apiKey,model="openrouter/free",file,dataUrl,textContent="",fetchImpl=globalThis.fetch}){
  if(!apiKey)throw new Error("OPENROUTER_NOT_CONNECTED");
  const instruction="Extraé SOLO información explícita del CV y devolvé JSON válido con: name, headline, location, targetRoles[], modes[], skills[], languages[], notes. No inventes. modes solo puede contener remote, local, microjobs. targetRoles debe inferirse conservadoramente de los roles reales del CV.";
  const content=[{type:"text",text:instruction}];
  const isPdf=String(file?.type||"").toLowerCase()==="application/pdf"||String(file?.name||"").toLowerCase().endsWith(".pdf");
  if(isPdf){
    if(!dataUrl)throw new Error("CV_PDF_DATA_REQUIRED");
    content.push({type:"file",file:{filename:file?.name||"cv.pdf",file_data:dataUrl}});
  }else{
    if(!textContent)throw new Error("CV_TEXT_REQUIRED");
    content.push({type:"text",text:"\nCV:\n"+textContent.slice(0,50000)});
  }
  const body={model,messages:[{role:"user",content}],temperature:.1};
  if(isPdf)body.plugins=[{id:"file-parser",pdf:{engine:"cloudflare-ai"}}];
  const r=await fetchImpl(CHAT_URL,{method:"POST",headers:jsonHeaders(apiKey),body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data?.error?.message||`OPENROUTER_${r.status}`);
  return parseJsonObject(data?.choices?.[0]?.message?.content||"");
}

export function createSpeechController({
  SpeechRecognitionCtor=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition,
  speechSynthesis=globalThis.speechSynthesis
}={}){
  return{
    recognitionSupported:Boolean(SpeechRecognitionCtor),
    synthesisSupported:Boolean(speechSynthesis),
    listen({lang="es-AR",onText=()=>{},onError=()=>{}}={}){
      if(!SpeechRecognitionCtor){onError(new Error("SPEECH_RECOGNITION_UNAVAILABLE"));return null;}
      const rec=new SpeechRecognitionCtor();
      rec.lang=lang; rec.interimResults=false; rec.continuous=false;
      rec.onresult=e=>onText(e.results?.[0]?.[0]?.transcript||"");
      rec.onerror=e=>onError(new Error(e.error||"SPEECH_RECOGNITION_ERROR"));
      rec.start();
      return rec;
    },
    speak(text,{lang="es-AR"}={}){
      if(!speechSynthesis||typeof SpeechSynthesisUtterance==="undefined")return false;
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(String(text||"")); u.lang=lang;
      speechSynthesis.speak(u);
      return true;
    },
    stop(){try{speechSynthesis?.cancel?.();}catch{}}
  };
}