import {createHash} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";

const ORIGIN=process.env.JOBAS_FEED_ORIGIN||"https://jobas.simondalmasso44.workers.dev";
const OUT=process.env.JOBAS_FEED_REPORT||"docs/openai-codex-oss/FEED_SAMPLE_2026-10-09.json";
const sampleSeed="jobas-product-audit-2026-10-09-v1";
const hash=s=>createHash("sha256").update(String(s)).digest("hex");
const str=x=>String(x??"");
const locationOf=j=>str(j.location);
const parse=v=>v&&Number.isFinite(Date.parse(v))?Date.parse(v):null;
const score=j=>str(j.argentina?.label||"Unknown");
const dangerHost=h=>!h||/^(?:localhost|.*\.localhost|.*\.local|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1|\[::1\]|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(h);
const safeUrl=input=>{try{const u=new URL(input);return u.protocol==="https:"&&!dangerHost(u.hostname)?u:null;}catch{return null;}};
const age=(j,now)=>{const time=parse(j.publishedAt);return time===null?null:Math.floor((now-time)/86400000);};
function selectJobs(jobs,now) {
 const groups=new Map();
 for(const j of jobs){const src=str(j.source)||"unknown"; if(!groups.has(src))groups.set(src,[]);groups.get(src).push(j);}
 const selected=new Map(),limitBySource=6,counts=new Map();
 function add(j,why){
  const id=str(j.id||j.url);
  if(!id||selected.has(id))return;
  const src=str(j.source)||"unknown";
  if((counts.get(src)||0)>=limitBySource)return;
  selected.set(id,{job:j,strata:[why]});
  counts.set(src,(counts.get(src)||0)+1);
 }
 for(const [src,list] of [...groups].sort((a,b)=>a[0].localeCompare(b[0]))) {
  for(const j of [...list].sort((a,b)=>hash(sampleSeed+str(a.id||a.url)).localeCompare(hash(sampleSeed+str(b.id||b.url)))).slice(0,3))add(j,"source:"+src);
 }
 const riskStrata=[
  ["undated",j=>parse(j.publishedAt)===null],
  ["old_45d",j=>(age(j,now)??0)>45],
  ["argentina_uncertain",j=>Number(j.argentina?.score||0)<80],
  ["local",j=>j.lane==="LOCAL"]
 ];
 for(const [label,pred] of riskStrata){
  const list=jobs.filter(pred).sort((a,b)=>hash(sampleSeed+label+str(a.id)).localeCompare(hash(sampleSeed+label+str(b.id))));
  for(const j of list.slice(0,label==="local"?8:10))add(j,label);
 }
 return [...selected.values()];
}
async function probe(job) {
 let url=safeUrl(job.url);
 const result={status:null,classification:"UNTESTED",redirects:0,finalUrl:null,titleSeen:false,companySeen:false,closureSignal:false,htmlEntityURL:/&(?:amp|#0*38|#x0*26);/i.test(str(job.url))};
 if(!url){result.classification="INVALID_OR_UNSAFE_URL";return result;}
 let res;
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),9000);
  try{
   for(let n=0;n<4;n++){
    res=await fetch(url,{redirect:"manual",signal:controller.signal,headers:{"User-Agent":"Mozilla/5.0 (compatible; JOBAS-Product-Audit/1.0)","Accept":"text/html,application/xhtml+xml"}});
    if(res.status>=300&&res.status<400){
     const loc=res.headers.get("location");
     const next=loc&&safeUrl(new URL(loc,url).href);
     if(!next){result.classification="REDIRECT_UNSAFE_OR_UNKNOWN";break;}
     url=next;result.redirects++;
     continue;
    }
    break;
   }
   result.status=res?.status??null;
   result.finalUrl=url.href;
   if(result.classification==="REDIRECT_UNSAFE_OR_UNKNOWN")return result;
   if(res?.status===403||res?.status===429){result.classification="BLOCKED_OR_RATE_LIMITED";return result;}
   if(res?.status===404||res?.status===410){result.classification="HTTP_NOT_FOUND";return result;}
   if(!res?.ok){result.classification="HTTP_ERROR_OR_REDIRECT";return result;}
   result.classification="HTTP_REACHABLE_NOT_VACANCY_VERIFIED";
   if(!/html|text/i.test(res.headers.get("content-type")||""))return result;
   let body="",size=0;
   for await(const chunk of res.body){
    const n=Math.min(chunk.length,65536-size);
    body+=new TextDecoder().decode(chunk.subarray(0,n));
    size+=n;
    if(size>=65536)break;
   }
   const normalized=body.toLowerCase().replace(/<[^>]+>/g," ").replace(/\s+/g," ");
   const titleTokens=str(job.title).toLowerCase().split(/[^a-z0-9áéíóúñ]+/u).filter(w=>w.length>3).slice(0,7);
   const present=titleTokens.filter(w=>normalized.includes(w));
   result.titleSeen=present.length>=Math.min(2,titleTokens.length)&&titleTokens.length>0;
   const co=str(job.company).toLowerCase().trim();
   result.companySeen=co.length>3&&normalized.includes(co);
   result.closureSignal=/\b(?:this job is closed|this position has been filled|job no longer available|posting has expired|this job has expired|job posting has been removed)\b/i.test(normalized);
   if(result.closureSignal)result.classification="POSSIBLY_CLOSED_REVIEW";
   else if(result.titleSeen||result.companySeen)result.classification="LISTING_TEXT_OBSERVED_NOT_OPEN_VERIFIED";
   return result;
  } finally {clearTimeout(timeout);}
 }catch(err){
  result.classification=err?.name==="AbortError"?"TIMEOUT":"NETWORK_OR_BLOCKED";
  return result;
 }
}
const endpoint=safeUrl(new URL("/api/feed",ORIGIN).href);
if(!endpoint)throw Error("SOURCE_NOT_PUBLIC_HTTPS");
const response=await fetch(endpoint,{signal:AbortSignal.timeout(20000),headers:{"Accept":"application/json"}});
if(!response.ok)throw Error("FEED_HTTP_"+response.status);
const feed=await response.json();
if(!Array.isArray(feed.jobs)||!feed.jobs.length)throw Error("EMPTY_FEED");
const now=Date.now(),selected=selectJobs(feed.jobs,now);
const outcomes=[];
for(let i=0;i<selected.length;i+=4) {
 const batch=selected.slice(i,i+4);
 const results=await Promise.all(batch.map(async x=>{
  const j=x.job;
  return {id:j.id,source:j.source,lane:j.lane||null,title:j.title,company:j.company,
    location:locationOf(j),argentinaLabel:score(j),argentinaScore:j.argentina?.score??null,
    publishedAt:j.publishedAt||null,ageDays:age(j,now),
    verifiedAt:j.verifiedAt||null,expiredAt:j.expiresAt||null,url:j.url,
    strata:x.strata,...await probe(j)};
 }));
 outcomes.push(...results);
}
const counts=Object.fromEntries([...new Set(outcomes.map(x=>x.classification))].sort().map(k=>[k,outcomes.filter(x=>x.classification===k).length]));
const dated=feed.jobs.filter(j=>parse(j.publishedAt)!==null);
const summary={snapshotGeneratedAt:feed.generatedAt,snapshotJobs:feed.jobs.length,snapshotIdentitySHA256:hash(feed.jobs.map(j=>str(j.id)+"|"+str(j.url)).sort().join("\n")),
  sampleSeed,selectedJobs:outcomes.length,bySource:Object.fromEntries([...new Set(outcomes.map(x=>x.source))].sort().map(k=>[k,outcomes.filter(x=>x.source===k).length])),
  statuses:counts,undatedInFeed:feed.jobs.length-dated.length,olderThan45Days:dated.filter(j=>age(j,now)>45).length,
  argentinaUnknownInFeed:feed.jobs.filter(j=>str(j.argentina?.label)==="A verificar").length,
  argentinaExplicitlyIncompatible:feed.jobs.filter(j=>str(j.argentina?.label)==="No compatible").length,
  htmlEscapedApplicationURLs:feed.jobs.filter(j=>/&(?:amp|#0*38|#x0*26);/i.test(str(j.url))).length,
  sampleSelectionSHA256:hash(outcomes.map(x=>str(x.id)+"|"+str(x.url)).sort().join("\n"))};
const result={purpose:"Bounded reproducible transport and HTML signal audit; not confirmation that jobs are open",checkedAt:new Date().toISOString(),sourceOrigin:ORIGIN,
 method:"3 deterministic SHA256-selected jobs per source, then prioritized undated, >45d, uncertain eligibility and LOCAL; cap 6 per source; single bounded GET per URL, max 3 redirects, 9-second timeout",
 interpretation:"HTTP 200 can be a generic landing page; textual title/company match is only a listing signal. HTTP 403/429 is ambiguous; even positive listing text does not establish a still-open vacancy.",
 summary,rows:outcomes};
await mkdir(OUT.split(/[\\/]/).slice(0,-1).join("/")||".",{recursive:true});
await writeFile(OUT,JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
console.log("OUT="+OUT);
const missing=outcomes.filter(x=>x.classification==="HTTP_NOT_FOUND"||x.classification==="POSSIBLY_CLOSED_REVIEW");
console.log("URGENT_RECHECK="+JSON.stringify(missing.map(x=>({id:x.id,url:x.url,classification:x.classification}))));
