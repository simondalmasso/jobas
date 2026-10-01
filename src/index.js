import { buildFeed, SOURCE_REGISTRY, DISCOVERY_SOURCES } from "./sources.js";
import { resolveApplicationMode } from "../public/workflow.js";
import { handleMcpRequest } from "./mcp.js";
const FEED_KEY="feed:v2";
const GPT_KEY="gpt-findings:v3";
const GPT_TTL_MS=5*60*1000;
const LOCAL_VERIFIED_SEED=[
  {
    id:"local-herfasa-marketing",
    lane:"LOCAL",
    curated:true,
    source:"local-radar",
    sourceName:"Computrabajo",
    sourceTrust:90,
    workerFee:false,
    sourceUrl:"https://ar.computrabajo.com/",
    sourceDetail:"https://ar.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-marketing-en-sauce-viejo-D58B626227BCC70861373E686DCF3405",
    title:"Analista de Marketing",
    company:"Aberturas Herfasa",
    location:"Sauce Viejo, Santa Fe",
    description:"Marketing & Community Manager presencial. Contenido, campañas orgánicas y pagas, diseño, web, atención digital y reporting.",
    url:"https://ar.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-marketing-en-sauce-viejo-D58B626227BCC70861373E686DCF3405",
    publishedAt:"2026-09-01T14:10:49-03:00",
    verifiedAt:"2026-09-24T20:20:00-03:00",
    category:"marketing",
    pay:{raw:"A convenir",monthlyMin:null,monthlyMax:null,currency:"ARS"},
    priority:96,
    argentina:{score:100,label:"Local",reason:"Sauce Viejo, Santa Fe · presencial"},
    scam:{score:90,label:"Verificada",reasons:[]}
  },
  {
    id:"local-community-santo-tome",
    lane:"LOCAL",
    curated:true,
    source:"local-radar",
    sourceName:"Computrabajo / Consultores de Empresas",
    sourceTrust:92,
    workerFee:false,
    sourceUrl:"https://ar.computrabajo.com/",
    sourceDetail:"https://ar.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-community-manager-santo-tome-en-santo-tome-8AE2139979D3F68661373E686DCF3405",
    title:"Community Manager",
    company:"Consultores de Empresas",
    location:"Santo Tomé / Sauce Viejo, Santa Fe",
    description:"Gestión de redes, calendario, influencers, reels, pauta y soporte a Marketing. Presencial, jornada de 6 o 9 horas.",
    url:"https://ar.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-community-manager-santo-tome-en-santo-tome-8AE2139979D3F68661373E686DCF3405",
    publishedAt:"2026-09-08T16:45:21-03:00",
    verifiedAt:"2026-09-24T20:20:00-03:00",
    category:"content-social",
    pay:{raw:"A convenir",monthlyMin:null,monthlyMax:null,currency:"ARS"},
    priority:91,
    argentina:{score:100,label:"Local",reason:"Santo Tomé / Sauce Viejo · presencial"},
    scam:{score:92,label:"Verificada",reasons:[]}
  },
  {
    id:"local-marketing-digital-consumo",
    lane:"LOCAL",
    curated:true,
    source:"local-radar",
    sourceName:"Computrabajo",
    sourceTrust:85,
    workerFee:false,
    sourceUrl:"https://ar.computrabajo.com/",
    sourceDetail:"https://ar.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-marketing-digital-y-comunicacion-en-santa-fe-A8696928B677F62C61373E686DCF3405",
    title:"Analista de Marketing Digital y Comunicación",
    company:"Empresa de consumo masivo",
    location:"Santa Fe, Santa Fe",
    description:"Campañas, Meta Business Suite, diseño, atención multicanal, reputación online y fidelización. Jornada lunes a viernes de 8 a 17.",
    url:"https://ar.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-analista-de-marketing-digital-y-comunicacion-en-santa-fe-A8696928B677F62C61373E686DCF3405",
    publishedAt:"2026-07-28T11:48:22-03:00",
    verifiedAt:"2026-09-24T20:20:00-03:00",
    category:"marketing",
    pay:{raw:"A convenir",monthlyMin:null,monthlyMax:null,currency:"ARS"},
    priority:88,
    argentina:{score:100,label:"Local",reason:"Santa Fe Capital · presencial"},
    scam:{score:85,label:"Verificada",reasons:[]}
  },
  {
    id:"local-universo-gerente-marketing",
    lane:"LOCAL",
    curated:true,
    source:"local-radar",
    sourceName:"Computrabajo / Universo",
    sourceTrust:88,
    workerFee:false,
    sourceUrl:"https://ar.computrabajo.com/",
    sourceDetail:"https://ar.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-gerente-de-marketing-en-santa-fe-1FFAC05504F33B1061373E686DCF3405",
    title:"Gerente de Marketing",
    company:"UNIVERSO",
    location:"Santa Fe, Santa Fe · híbrido",
    description:"Estrategia integral, branding, e-commerce, CRM, Power BI, presupuesto y liderazgo de equipo. Perfil senior.",
    url:"https://ar.computrabajo.com/ofertas-de-trabajo/oferta-de-trabajo-de-gerente-de-marketing-en-santa-fe-1FFAC05504F33B1061373E686DCF3405",
    publishedAt:"2026-09-11T17:12:02-03:00",
    verifiedAt:"2026-09-24T20:20:00-03:00",
    category:"marketing",
    pay:{raw:"A convenir",monthlyMin:null,monthlyMax:null,currency:"ARS"},
    priority:72,
    argentina:{score:100,label:"Local",reason:"Santa Fe · híbrido"},
    scam:{score:88,label:"Verificada",reasons:[]}
  }
];
const GPT_FILES=[
  {lane:"LOCAL",id:"local",name:"GPT BUSQ LOCAL",url:"https://raw.githubusercontent.com/simondalmasso/jobas/main/data/gpt-local.json"},
  {lane:"REMOTO",id:"remoto",name:"GPT BUSQ REMOTO",url:"https://raw.githubusercontent.com/simondalmasso/jobas/main/data/gpt-remoto.json"},
  {lane:null,id:"telegram",name:"GPT TELEGRAM RADAR",url:"https://raw.githubusercontent.com/simondalmasso/jobas/main/data/gpt-telegram.json"}
];
const headers={"content-type":"application/json; charset=utf-8","cache-control":"public, max-age=60, s-maxage=300","x-content-type-options":"nosniff","referrer-policy":"no-referrer"};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
async function readFeed(env){const raw=await env.JOBAS_FEED.get(FEED_KEY);if(!raw)return null;try{return JSON.parse(raw)}catch{return null}}
async function refresh(env){const limit=Math.max(40,Math.min(500,Number(env.FEED_LIMIT||320))),feed=await buildFeed(limit);await env.JOBAS_FEED.put(FEED_KEY,JSON.stringify(feed));return feed;}
function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
function normalizePay(x){const p=x.pay||x.salary||{};return{raw:p.raw||p.text||x.salaryText||"No publicado",monthlyMin:num(p.monthlyMin??p.minMonthly),monthlyMax:num(p.monthlyMax??p.maxMonthly),currency:p.currency||"USD",period:p.period||null};}
function normalizeFinding(x,meta){
  if(!x||!x.title||!x.company)return null;
  const lane=meta.lane||x.lane||"REMOTO";
  const sourceId=meta.id||String(lane).toLowerCase();
  const applyUrl=x.applyUrl||x.url||x.messageUrl||x.sourceUrl||"";
  const score=Math.max(0,Math.min(100,num(x.rank?.score??x.priority)??70));
  const argentinaScore=lane==="LOCAL"?100:(x.argentina?.score??(x.argentinaEligible===false?5:x.argentinaEligible===true?92:70));
  const scamScore=x.scam?.score??(x.scamRisk==="high"?25:x.scamRisk==="medium"?60:90);
  return{
    id:x.id||("gpt-"+sourceId+"-"+String(x.company)+"-"+String(x.title)),
    lane,curated:true,source:"gpt-"+sourceId,sourceName:x.sourceName||meta.name,sourceTrust:95,
    workerFee:x.workerFee===false?false:(x.workerFee===true?true:null),sourceUrl:x.sourceUrl||applyUrl,sourceDetail:x.messageUrl||x.sourceUrl||applyUrl,
    title:String(x.title),company:String(x.company),location:String(x.location||(lane==="LOCAL"?"Santa Fe":"Remote / A verificar")),
    description:String(x.description||x.summary||x.rank?.reason||"").slice(0,1600),url:applyUrl,directUrl:x.directUrl||x.followUpUrl||null,applicationMode:resolveApplicationMode({...x,source:"gpt-"+sourceId,sourceName:x.sourceName||meta.name,sourceUrl:x.sourceUrl||applyUrl,sourceDetail:x.messageUrl||x.sourceUrl||applyUrl,url:applyUrl}),publishedAt:x.publishedAt||x.messageDate||null,verifiedAt:x.verifiedAt||null,
    tags:Array.isArray(x.tags)?x.tags:[],category:x.category||"other",pay:normalizePay(x),priority:score,rankReason:x.rank?.reason||"",
    argentina:{score:Number(argentinaScore),label:lane==="LOCAL"?"Local":(x.argentina?.label||(x.argentinaEligible===true?"Argentina/LatAm":"A verificar")),reason:x.argentina?.reason||""},
    scam:{score:Number(scamScore),label:Number(scamScore)>=80?"Verificada":Number(scamScore)>=50?"Revisada":"Riesgo",reasons:x.scam?.reasons||[]}
  };
}
async function loadGptFindings(env){
  const cached=await env.JOBAS_FEED.get(GPT_KEY);
  if(cached){try{const parsed=JSON.parse(cached);if(Date.now()-parsed.cachedAt<GPT_TTL_MS)return parsed;}catch{}}
  const settled=await Promise.allSettled(GPT_FILES.map(async meta=>{
    const r=await fetch(meta.url,{headers:{"user-agent":"JOBAS/1.0","cache-control":"no-cache"}});
    if(!r.ok)throw new Error(String(r.status));
    const data=await r.json();
    const findings=(data.findings||[]).map(x=>normalizeFinding(x,meta)).filter(Boolean);
    return{meta,updatedAt:data.updatedAt||null,findings};
  }));
  const jobs=[],health=[];
  settled.forEach((res,i)=>{const meta=GPT_FILES[i];if(res.status==="fulfilled"){jobs.push(...res.value.findings);health.push({source:"gpt-"+(meta.id||String(meta.lane).toLowerCase()),name:meta.name,state:"healthy",jobs:res.value.findings.length,lastCheck:new Date().toISOString(),url:meta.url,updatedAt:res.value.updatedAt});}else health.push({source:"gpt-"+(meta.id||String(meta.lane).toLowerCase()),name:meta.name,state:"degraded",jobs:0,lastCheck:new Date().toISOString(),url:meta.url,error:String(res.reason?.message||res.reason)});});
  const payload={cachedAt:Date.now(),jobs,health};
  await env.JOBAS_FEED.put(GPT_KEY,JSON.stringify(payload),{expirationTtl:86400});
  return payload;
}
function mergeFeed(feed,gpt){
  const map=new Map();
  for(const job of [...LOCAL_VERIFIED_SEED,...(gpt.jobs||[]),...(feed.jobs||[])]){const key=String(job.url||job.id||job.company+"|"+job.title).toLowerCase();if(!map.has(key))map.set(key,job);}
  const jobs=[...map.values()].sort((a,b)=>(b.priority||0)-(a.priority||0));
  const counts={};for(const j of jobs)counts[j.category]=(counts[j.category]||0)+1;
  const categories=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([id,count])=>({id,count}));
  return{...feed,version:"feed-v3",jobs,jobsCount:jobs.length,categories,health:[...(gpt.health||[]),...(feed.health||[])],gptFindingsCount:(gpt.jobs||[]).length};
}
async function currentFeed(env){
  const base=await readFeed(env)||await refresh(env);
  const gpt=await loadGptFindings(env);
  return mergeFeed(base,gpt);
}
async function currentSources(env){
  const feed=await readFeed(env);
  const gpt=await loadGptFindings(env);
  return{active:Object.values(SOURCE_REGISTRY),health:[...(gpt.health||[]),...(feed?.health||[])],discovery:DISCOVERY_SOURCES,gptFiles:GPT_FILES};
}
async function fetchPublicText(url){
  const r=await fetch(url,{headers:{"user-agent":"JOBAS-MCP/1.0","accept":"text/plain, text/markdown, application/json"}});
  if(!r.ok)throw new Error("FETCH_"+r.status);
  return r.text();
}
export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==="/api/health"){const feed=await readFeed(env);return json({ok:true,service:"JOBAS",mode:"public-feed",auth:false,generatedAt:feed?.generatedAt||null,jobsCount:feed?.jobsCount||0,version:"feed-v3"});}
    if(url.pathname==="/api/feed")return json(await currentFeed(env));
    if(url.pathname==="/api/sources")return json(await currentSources(env));
    if(url.pathname==="/mcp"){
      return handleMcpRequest(request,{
        getFeed:()=>currentFeed(env),
        getSources:()=>currentSources(env),
        fetchText:fetchPublicText
      });
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(_controller,env,ctx){ctx.waitUntil(Promise.all([refresh(env),loadGptFindings(env)]));}
};
