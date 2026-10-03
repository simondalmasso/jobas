import { buildFeed, SOURCE_REGISTRY, DISCOVERY_SOURCES } from "./sources.js";
import { finalizeJob } from "./judge.js";
import { resolveApplicationMode } from "../public/workflow.js";
import { handleMcpRequest } from "./mcp.js";
import localRadar from "../data/gpt-local.json" with { type: "json" };
import remoteRadar from "../data/gpt-remoto.json" with { type: "json" };
import curatedLocal from "../data/curated-local.json" with { type: "json" };

const FEED_KEY="feed:v2";

const DATA_FILES=[
  {lane:"LOCAL",id:"local",name:"Curated local radar",path:"data/gpt-local.json",data:localRadar},
  {lane:"REMOTO",id:"remoto",name:"Curated remote radar",path:"data/gpt-remoto.json",data:remoteRadar},
  {lane:"LOCAL",id:"curated-local",name:"Verified local coverage",path:"data/curated-local.json",data:curatedLocal}
];

const SECURITY_HEADERS={
  "content-security-policy":"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://openrouter.ai; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'self'; form-action 'self'; upgrade-insecure-requests",
  "x-content-type-options":"nosniff",
  "x-frame-options":"DENY",
  "referrer-policy":"no-referrer",
  "permissions-policy":"camera=(), geolocation=(), microphone=(self), payment=()",
  "strict-transport-security":"max-age=31536000; includeSubDomains"
};
const JSON_HEADERS={
  "content-type":"application/json; charset=utf-8",
  "cache-control":"public, max-age=60, s-maxage=300",
  ...SECURITY_HEADERS
};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:JSON_HEADERS});

async function readFeed(env){
  const raw=await env.JOBAS_FEED.get(FEED_KEY);
  if(!raw)return null;
  try{return JSON.parse(raw);}catch{return null;}
}
async function refresh(env){
  const limit=Math.max(40,Math.min(500,Number(env.FEED_LIMIT||320)));
  const feed=await buildFeed(limit);
  await env.JOBAS_FEED.put(FEED_KEY,JSON.stringify(feed));
  return feed;
}
function num(v){
  const n=Number(v);
  return Number.isFinite(n)?n:null;
}
function normalizePay(x){
  const p=x.pay||x.salary||{};
  return{
    raw:p.raw||p.text||x.salaryText||"No publicado",
    monthlyMin:num(p.monthlyMin??p.minMonthly),
    monthlyMax:num(p.monthlyMax??p.maxMonthly),
    currency:p.currency||"USD",
    period:p.period||null
  };
}
function isCurrentFinding(x){
  if(x?.active===false)return false;
  if(x?.expiresAt){
    const expires=new Date(x.expiresAt).getTime();
    if(Number.isFinite(expires)&&expires<Date.now())return false;
  }
  return true;
}
function normalizeFinding(x,meta){
  const companyName=x?.company||x?.buyer;
  if(!x||!x.title||!companyName)return null;
  const lane=meta.lane||x.lane||"REMOTO";
  const sourceId=meta.id||String(lane).toLowerCase();
  const applyUrl=x.applyUrl||x.url||x.messageUrl||x.sourceDetail||x.sourceUrl||"";
  const base={
    id:x.id||("curated-"+sourceId+"-"+String(companyName)+"-"+String(x.title)),
    lane,
    curated:true,
    source:"data-"+sourceId,
    sourceName:x.sourceName||meta.name,
    sourceTrust:num(x.sourceTrust)??90,
    workerFee:x.workerFee===false?false:(x.workerFee===true?true:null),
    sourceUrl:x.sourceUrl||applyUrl,
    sourceDetail:x.sourceDetail||x.messageUrl||x.sourceUrl||applyUrl,
    title:String(x.title),
    company:String(companyName),
    buyer:x.buyer||null,
    prospectType:x.prospectType||null,
    location:String(x.location||(lane==="LOCAL"?"Argentina":"Remote / A verificar")),
    description:String(x.description||x.summary||"").slice(0,1600),
    url:applyUrl,
    directUrl:x.directUrl||x.followUpUrl||null,
    applicationMode:resolveApplicationMode({
      ...x,
      source:"data-"+sourceId,
      sourceName:x.sourceName||meta.name,
      sourceUrl:x.sourceUrl||applyUrl,
      sourceDetail:x.sourceDetail||x.messageUrl||x.sourceUrl||applyUrl,
      url:applyUrl
    }),
    publishedAt:x.publishedAt||x.messageDate||null,
    verifiedAt:x.verifiedAt||null,
    expiresAt:x.expiresAt||null,
    evidence:Array.isArray(x.evidence)?x.evidence:[],
    tags:Array.isArray(x.tags)?x.tags:[],
    category:x.category||"other",
    pay:normalizePay(x)
  };
  return finalizeJob(base);
}
function loadCuratedFindings(){
  const jobs=[],health=[];
  for(const meta of DATA_FILES){
    const data=meta.data||{};
    const findings=(data.findings||[]).filter(isCurrentFinding).map(x=>normalizeFinding(x,meta)).filter(Boolean);
    jobs.push(...findings);
    health.push({
      source:"data-"+meta.id,
      name:meta.name,
      state:"healthy",
      jobs:findings.length,
      lastCheck:new Date().toISOString(),
      path:meta.path,
      updatedAt:data.updatedAt||null
    });
  }
  return{jobs,health};
}
function normalizeBaseFeed(feed){
  return{
    ...(feed||{}),
    rankingModel:"generic-quality-v1",
    jobs:Array.isArray(feed?.jobs)?feed.jobs.map(finalizeJob):[]
  };
}
function mergeFeed(feed,curated){
  const normalized=normalizeBaseFeed(feed);
  const map=new Map();
  for(const job of [...(curated.jobs||[]),...(normalized.jobs||[])]){
    const key=String(job.url||job.id||job.company+"|"+job.title).toLowerCase();
    const prev=map.get(key);
    if(!prev||Number(job.qualityScore||0)>Number(prev.qualityScore||0))map.set(key,job);
  }
  const jobs=[...map.values()].sort((a,b)=>
    Number(b.qualityScore||0)-Number(a.qualityScore||0)||
    String(b.publishedAt||"").localeCompare(String(a.publishedAt||""))
  );
  const counts={};
  for(const j of jobs)counts[j.category]=(counts[j.category]||0)+1;
  const categories=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([id,count])=>({id,count}));
  return{
    ...normalized,
    version:"feed-v4",
    rankingModel:"generic-quality-v1",
    jobs,
    jobsCount:jobs.length,
    categories,
    health:[...(curated.health||[]),...(normalized.health||[])],
    curatedFindingsCount:(curated.jobs||[]).length
  };
}
async function currentFeed(env){
  const base=await readFeed(env)||await refresh(env);
  const curated=loadCuratedFindings();
  return mergeFeed(base,curated);
}
async function currentSources(env){
  const feed=await readFeed(env);
  const curated=loadCuratedFindings();
  return{
    active:Object.values(SOURCE_REGISTRY),
    health:[...(curated.health||[]),...(feed?.health||[])],
    discovery:DISCOVERY_SOURCES,
    dataFiles:DATA_FILES.map(({data,...meta})=>meta)
  };
}
async function fetchPublicText(url){
  const r=await fetch(url,{headers:{"user-agent":"JOBAS-MCP/1.0","accept":"text/plain, text/markdown, application/json"}});
  if(!r.ok)throw new Error("FETCH_"+r.status);
  return r.text();
}
function withSecurityHeaders(response){
  const headers=new Headers(response.headers);
  for(const [key,value] of Object.entries(SECURITY_HEADERS))headers.set(key,value);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

export default{
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==="/api/health"){
      const feed=await readFeed(env);
      return json({
        ok:true,
        service:"JOBAS",
        mode:"public-feed",
        auth:false,
        generatedAt:feed?.generatedAt||null,
        jobsCount:feed?.jobsCount||0,
        version:"feed-v4",
        rankingModel:"generic-quality-v1"
      });
    }
    if(url.pathname==="/api/feed")return json(await currentFeed(env));
    if(url.pathname==="/api/sources")return json(await currentSources(env));
    if(url.pathname==="/mcp"){
      const response=await handleMcpRequest(request,{
        getFeed:()=>currentFeed(env),
        getSources:()=>currentSources(env),
        fetchText:fetchPublicText
      });
      return withSecurityHeaders(response);
    }
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
  async scheduled(_controller,env,ctx){
    ctx.waitUntil(refresh(env));
  }
};

export { SECURITY_HEADERS, DATA_FILES, normalizeFinding, mergeFeed, loadCuratedFindings };
