import { normalizeMonthlyPay, finalizeJob } from "./judge.js";
const UA="JOBAS/1.0";
const MAX_DESCRIPTION=1200;
export const SOURCE_REGISTRY={
  weremoto:{name:"WeRemoto",trust:94,workerFee:false,kind:"html",homepage:"https://www.weremoto.com/"},
  freehire:{name:"Freehire",trust:84,workerFee:false,kind:"aggregator-api",homepage:"https://freehire.me/"},
  remoteok:{name:"Remote OK",trust:84,workerFee:false,kind:"api",homepage:"https://remoteok.com/"},
  remotive:{name:"Remotive",trust:88,workerFee:false,kind:"api",homepage:"https://remotive.com/remote-jobs"},
  himalayas:{name:"Himalayas",trust:91,workerFee:false,kind:"api",homepage:"https://himalayas.app/jobs"},
  jobicy:{name:"Jobicy",trust:84,workerFee:false,kind:"api",homepage:"https://jobicy.com/jobs"},
  wwr:{name:"We Work Remotely",trust:90,workerFee:false,kind:"rss",homepage:"https://weworkremotely.com/"},
  carryer:{name:"Carryer Tech",trust:88,workerFee:false,kind:"js-feed",homepage:"https://jobs.carryer.tech/"}
};
export const DISCOVERY_SOURCES=[
  {name:"Dynamite Jobs",url:"https://dynamitejobs.com/location/remote-jobs-in-latinamerica",note:"Curado, remoto y con salarios públicos frecuentes.",workerFee:false},
  {name:"Remote.co",url:"https://remote.co/remote-jobs/",note:"Bolsa remota general.",workerFee:false},
  {name:"Turing",url:"https://work.turing.com/jobs",note:"Sin cargo para candidatos; más orientado a perfiles técnicos/IA.",workerFee:false},
  {name:"micro1",url:"https://www.micro1-jobs.com/",note:"Roles remotos y proyectos de IA; verificar elegibilidad por vacante.",workerFee:false},
  {name:"Twine",url:"https://www.twine.net/jobs",note:"Marketplace freelance; revisar comisiones/condiciones del proyecto.",workerFee:null},
  {name:"Wellfound",url:"https://wellfound.com/jobs",note:"Startups y remoto.",workerFee:false},
  {name:"Revelo",url:"https://www.revelo.com/",note:"Talento LatAm para compañías remotas.",workerFee:false},
  {name:"Jobfound",url:"https://jobfound.org/",note:"Agregador; verificar ubicación y enlace final.",workerFee:null}
];
export function cleanHtml(x=""){return String(x).replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&ndash;|&#8211;/g,"–").replace(/&mdash;|&#8212;/g,"—").replace(/\s+/g," ").trim();}
function safeUrl(x="",base){try{const u=new URL(x,base);return u.protocol==="https:"?u.href:"";}catch{return"";}}
async function get(url,type="json"){const r=await fetch(url,{headers:{"user-agent":UA,"accept":type==="json"?"application/json":"text/html,application/rss+xml,text/xml"}});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return type==="json"?r.json():r.text();}
function baseJob(source,x){const meta=SOURCE_REGISTRY[source];return{id:`${source}:${x.id||x.guid||x.slug||x.url||crypto.randomUUID()}`,source,sourceName:meta.name,sourceTrust:meta.trust,workerFee:meta.workerFee,sourceUrl:meta.homepage,title:String(x.title||"").trim(),company:String(x.company||"").trim(),location:String(x.location||"Remote").trim(),description:cleanHtml(x.description||"").slice(0,MAX_DESCRIPTION),url:safeUrl(x.url||"",meta.homepage),publishedAt:x.publishedAt||null,tags:Array.isArray(x.tags)?x.tags.slice(0,16):[],worldwide:!!x.worldwide,pay:x.pay||normalizeMonthlyPay({}),sourceDetail:x.sourceDetail||null};}
function keep(job){return!!(job.title&&job.company&&job.url)&&(!job.argentina||job.argentina.score>10)&&(!job.scam||job.scam.score>=35);}
export function parseSalaryText(text=""){const s=cleanHtml(text);let m=s.match(/(?:USD\s*|US\$\s*|\$\s*)([\d,.]+)\s*(?:-|–|—|to)\s*(?:USD\s*|US\$\s*|\$\s*)?([\d,.]+)\s*(?:per\s*)?(hour|hr|week|month|year|annual)/i);if(m){const p=/hour|hr/i.test(m[3])?"hourly":/week/i.test(m[3])?"weekly":/month/i.test(m[3])?"monthly":"annual";return normalizeMonthlyPay({min:Number(m[1].replace(/,/g,"")),max:Number(m[2].replace(/,/g,"")),currency:"USD",period:p,raw:m[0]});}m=s.match(/(?:USD\s*|US\$\s*|\$\s*)([\d,.]+)\s*(?:per\s*)?(hour|hr|week|month|year|annual)/i);if(!m)return normalizeMonthlyPay({raw:"No publicado"});const p=/hour|hr/i.test(m[2])?"hourly":/week/i.test(m[2])?"weekly":/month/i.test(m[2])?"monthly":"annual",n=Number(m[1].replace(/,/g,""));return normalizeMonthlyPay({min:n,max:n,currency:"USD",period:p,raw:m[0]});}
function parseShortSpanishDate(text){if(!text)return null;const months={ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sept:8,sep:8,oct:9,nov:10,dic:11},m=String(text).toLowerCase().match(/(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic)/);if(!m)return null;const now=new Date();let d=new Date(Date.UTC(now.getUTCFullYear(),months[m[2]],Number(m[1])));if(d.getTime()>now.getTime()+7*86400000)d=new Date(Date.UTC(now.getUTCFullYear()-1,months[m[2]],Number(m[1])));return d.toISOString();}
export async function fetchWeRemoto(){const html=await get("https://www.weremoto.com/","text"),articles=html.match(/<article\b[\s\S]*?<\/article>/gi)||[];return articles.map((item,i)=>{const titleMatch=item.match(/<h3[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i),companyMatch=item.match(/<h3[\s\S]*?<\/h3><p[^>]*>([\s\S]*?)<\/p>/i),locationMatch=item.match(/<span[^>]*class="[^"]*truncate text-xs[^"]*"[^>]*>([\s\S]*?)<\/span>/i),dateMatch=item.match(/<span[^>]*class="[^"]*text-xs[^"]*"[^>]*>(\d{1,2}\s+[A-Za-záéíóúñ]+)<\/span>/i),bodyMatch=item.match(/<div class="article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i),applyMatch=item.match(/<a href="([^"]+)"[^>]*target="_blank"[^>]*>Aplicar<\/a>/i),rel=titleMatch?.[1]||"",listingUrl=safeUrl(rel,"https://www.weremoto.com/"),applyUrl=safeUrl(applyMatch?.[1],"https://www.weremoto.com/")||listingUrl,description=cleanHtml(bodyMatch?.[1]);return finalizeJob(baseJob("weremoto",{id:rel||String(i),title:cleanHtml(titleMatch?.[2]),company:cleanHtml(companyMatch?.[1]),location:cleanHtml(locationMatch?.[1])||"Remote (LATAM)",description,url:applyUrl,publishedAt:parseShortSpanishDate(dateMatch?.[1]),tags:["LatAm","remote"],worldwide:/worldwide/i.test(description),pay:parseSalaryText(description),sourceDetail:listingUrl}));}).filter(keep);}
export async function fetchFreehire(){const url="https://freehire.me/api/v1/agent/jobs/search?regions=latam&work_mode=remote&posted_within_days=21&limit=60&offset=0&semantic_ratio=0&include_description=true&description_format=text",data=await get(url);return(data.data||[]).map(x=>finalizeJob(baseJob("freehire",{id:x.public_slug,title:x.title,company:x.company,location:x.location||"Remote LATAM",description:x.description,url:x.url,publishedAt:x.posted_at||x.date,tags:[x.category,x.seniority,...(x.skills||[])].filter(Boolean),worldwide:(x.regions||[]).includes("global"),pay:parseSalaryText(x.salary_text||x.description||""),sourceDetail:`https://freehire.me/jobs/${x.public_slug}`}))).filter(keep);}

function parseCarryerPay(text=""){
  const raw=cleanHtml(text);
  if(!raw||/not listed|rate not listed/i.test(raw))return normalizeMonthlyPay({raw:raw||"No publicado"});
  let m=raw.match(/\$?\s*([\d.]+)k\s*(?:-|–|—|to)\s*\$?\s*([\d.]+)k\s*USD\s*\/\s*month/i);
  if(m)return normalizeMonthlyPay({min:Number(m[1])*1000,max:Number(m[2])*1000,currency:"USD",period:"monthly",raw});
  m=raw.match(/\$?\s*([\d.]+)k\s*(?:-|–|—|to)\s*\$?\s*([\d.]+)k(?:\s*USD)?\s*\/\s*month/i);
  if(m)return normalizeMonthlyPay({min:Number(m[1])*1000,max:Number(m[2])*1000,currency:"USD",period:"monthly",raw});
  m=raw.match(/\$\s*([\d.]+)\s*(?:-|–|—|to)\s*\$?\s*([\d.]+)\s*USD\s*\/\s*hour/i);
  if(m)return normalizeMonthlyPay({min:Number(m[1]),max:Number(m[2]),currency:"USD",period:"hourly",raw});
  m=raw.match(/\$\s*([\d.]+)\s*USD\s*\/\s*hour/i);
  if(m)return normalizeMonthlyPay({min:Number(m[1]),max:Number(m[1]),currency:"USD",period:"hourly",raw});
  m=raw.match(/\$\s*([\d.]+)k\s*(?:-|–|—|to)\s*\$?\s*([\d.]+)k/i);
  if(m)return normalizeMonthlyPay({min:Number(m[1])*1000,max:Number(m[2])*1000,currency:"USD",period:"annual",raw});
  return normalizeMonthlyPay({raw});
}
function carryerArgentinaCompatible(x){
  const setup=String(x.setup||"").toLowerCase();
  const region=String(x.region||"").toLowerCase();
  const loc=String(x.location||"").toLowerCase();
  if(!setup.includes("remote"))return false;
  if(/united states only|usa only|us only|canada only|north america only/.test(loc))return false;
  if(/argentina/.test(loc))return true;
  if(region==="latam"){
    if(/^brazil\b/.test(loc)&&!/argentina|colombia|mexico|paraguay|chile|peru|uruguay|costa rica/.test(loc))return false;
    return true;
  }
  if(region==="global"){
    if(/born and raised in spain|must.*spain|must.*united states|must.*usa|must.*canada/.test(loc))return false;
    return /global|worldwide|remote|americas|south america|countries not specified|argentina/.test(loc);
  }
  return /americas.*south america|south america|argentina/.test(loc);
}
export async function fetchCarryer(){
  const js=await get("https://jobs.carryer.tech/jobs.js","text");
  const match=js.match(/window\.CARRYER_JOBS\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
  if(!match)throw new Error("Carryer feed format changed");
  const data=JSON.parse(match[1]);
  return data.filter(carryerArgentinaCompatible).map(x=>{
    const roleUrl="https://jobs.carryer.tech/?role="+encodeURIComponent(x.id);
    const direct=x.applyUrl&&String(x.applyUrl).startsWith("https://")?x.applyUrl:roleUrl;
    const company=x.source==="Carryer Tech"?"Carryer Tech client":String(x.source||"Carryer Tech");
    const parts=[x.companyType,x.kind,Array.isArray(x.stack)&&x.stack.length?"Skills: "+x.stack.join(", "):"",x.compensation?"Compensation: "+x.compensation:""].filter(Boolean);
    return finalizeJob(baseJob("carryer",{
      id:x.id,title:x.title,company,location:x.location||x.region||"Remote",description:parts.join(". "),url:direct,
      publishedAt:x.updatedAt?new Date(x.updatedAt+"T12:00:00Z").toISOString():null,
      tags:[x.category,x.kind,x.source,...(x.stack||[])].filter(Boolean),
      worldwide:String(x.region||"").toLowerCase()==="global",
      pay:parseCarryerPay(x.compensation),
      sourceDetail:roleUrl
    }));
  }).filter(keep);
}
export async function fetchRemoteOK(){const data=await get("https://remoteok.com/api");return data.slice(1,180).map(x=>finalizeJob(baseJob("remoteok",{id:x.id||x.slug,title:x.position,company:x.company,location:x.location||"Remote",description:x.description,url:x.url,publishedAt:x.date,tags:x.tags||[],worldwide:/worldwide|anywhere/i.test(x.location||""),pay:normalizeMonthlyPay({min:x.salary_min,max:x.salary_max,currency:"USD",period:"annual"})}))).filter(keep);}
export async function fetchRemotive(){const data=await get("https://remotive.com/api/remote-jobs?limit=160");return(data.jobs||[]).map(x=>finalizeJob(baseJob("remotive",{id:x.id,title:x.title,company:x.company_name,location:x.candidate_required_location||"Remote",description:x.description,url:x.url,publishedAt:x.publication_date,tags:x.tags||[],worldwide:/worldwide|anywhere/i.test(x.candidate_required_location||""),pay:parseSalaryText(x.salary)}))).filter(keep);}
export async function fetchHimalayas(){const data=await get("https://himalayas.app/jobs/api?limit=40");return(data.jobs||[]).map(x=>finalizeJob(baseJob("himalayas",{id:x.guid,title:x.title,company:x.companyName,location:(x.locationRestrictions||[]).join(", ")||"Worldwide",description:x.description||x.excerpt,url:x.applicationLink,publishedAt:x.pubDate,tags:[...(x.categories||[]),x.seniority].filter(Boolean),worldwide:!(x.locationRestrictions||[]).length,pay:normalizeMonthlyPay({min:x.minSalary,max:x.maxSalary,currency:x.currency||"USD",period:x.salaryPeriod||"annual"})}))).filter(keep);}
export async function fetchJobicy(){const data=await get("https://jobicy.com/api/v2/remote-jobs?count=120");return(data.jobs||[]).map(x=>finalizeJob(baseJob("jobicy",{id:x.id,title:x.jobTitle,company:x.companyName,location:x.jobGeo||"Remote",description:x.jobDescription,url:x.url,publishedAt:x.pubDate,tags:[x.jobIndustry,x.jobType].filter(Boolean),worldwide:/anywhere|worldwide|global/i.test(x.jobGeo||""),pay:normalizeMonthlyPay({min:x.annualSalaryMin,max:x.annualSalaryMax,currency:x.salaryCurrency||"USD",period:"annual"})}))).filter(keep);}
function xmlTag(item,tag){const m=item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,"i"));return m?cleanHtml(m[1].replace(/^<!\[CDATA\[|\]\]>$/g,"")):"";}
export async function fetchWWR(){const xml=await get("https://weworkremotely.com/remote-jobs.rss","text"),items=xml.match(/<item>[\s\S]*?<\/item>/gi)||[];return items.slice(0,140).map(item=>{const titleRaw=xmlTag(item,"title"),parts=titleRaw.split(":"),company=parts.shift()||"",description=xmlTag(item,"description"),region=xmlTag(item,"region"),country=xmlTag(item,"country");return finalizeJob(baseJob("wwr",{id:xmlTag(item,"guid")||xmlTag(item,"link"),title:parts.join(":").trim()||titleRaw,company:company.trim()||"Empresa",location:[region,country].filter(Boolean).join(", ")||"Remote",description,url:xmlTag(item,"link"),publishedAt:xmlTag(item,"pubDate"),tags:[xmlTag(item,"category")].filter(Boolean),worldwide:/anywhere|worldwide/i.test(region),pay:parseSalaryText(description)}));}).filter(keep);}
function canonicalJobKey(job){const norm=s=>String(s||"").toLowerCase().replace(/\bremote\b|\blatam\b|\bworldwide\b/g," ").replace(/[^a-z0-9áéíóúüñ]+/gi," ").replace(/\s+/g," ").trim();return`${norm(job.company)}|${norm(job.title)}`;}
export async function buildFeed(limit=320){const startedAt=new Date().toISOString(),adapters=[["weremoto",fetchWeRemoto],["freehire",fetchFreehire],["carryer",fetchCarryer],["remoteok",fetchRemoteOK],["remotive",fetchRemotive],["himalayas",fetchHimalayas],["jobicy",fetchJobicy],["wwr",fetchWWR]],results=await Promise.allSettled(adapters.map(([,fn])=>fn())),health=[],all=[];results.forEach((r,i)=>{const id=adapters[i][0],meta=SOURCE_REGISTRY[id];if(r.status==="fulfilled"){health.push({source:id,name:meta.name,state:r.value.length?"healthy":"empty",jobs:r.value.length,lastCheck:new Date().toISOString(),url:meta.homepage});all.push(...r.value);}else health.push({source:id,name:meta.name,state:"degraded",jobs:0,lastCheck:new Date().toISOString(),url:meta.homepage,error:String(r.reason?.message||r.reason).slice(0,180)});});const byKey=new Map();for(const job of all){const key=canonicalJobKey(job),prev=byKey.get(key);if(!prev||job.qualityScore>prev.qualityScore)byKey.set(key,job);}const jobs=[...byKey.values()].sort((a,b)=>b.qualityScore-a.qualityScore||String(b.publishedAt||"").localeCompare(String(a.publishedAt||""))).slice(0,limit),counts={};for(const j of jobs)counts[j.category]=(counts[j.category]||0)+1;const categories=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([id,count])=>({id,count}));return{version:"feed-v4",rankingModel:"generic-quality-v1",generatedAt:new Date().toISOString(),startedAt,jobsCount:jobs.length,jobs,categories,health,discoverySources:DISCOVERY_SOURCES,refreshPolicy:{cadence:"daily",cron:"15 10 * * *",sourceCallsPerRun:8}};}
