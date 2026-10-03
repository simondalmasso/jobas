import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {finalizeJob,qualityBreakdown} from "../src/judge.js";
import {normalizeFinding,mergeFeed} from "../src/index.js";

test("server quality ignores category preference and strips owner fit fields",()=>{
  const common={
    company:"Acme",location:"Argentina",description:"role",sourceTrust:90,workerFee:false,
    publishedAt:"2026-10-01T00:00:00Z",pay:{raw:"USD 1000",monthlyMin:1000,monthlyMax:1000,currency:"USD"}
  };
  const a=finalizeJob({...common,title:"Customer Success",category:"customer-success",priority:100,rank:{score:100}});
  const b=finalizeJob({...common,title:"Backend Engineer",category:"tech",priority:1,rank:{score:1}});
  assert.equal(a.qualityScore,b.qualityScore);
  assert.equal("priority" in a,false);
  assert.equal("rank" in a,false);
  assert.deepEqual(qualityBreakdown(a).components,qualityBreakdown(b).components);
});

test("curated normalization never consumes rank.score or priority",()=>{
  const x=normalizeFinding({
    id:"x",title:"Job",company:"Acme",location:"Argentina",description:"fact",
    sourceName:"Source",sourceUrl:"https://example.com",applyUrl:"https://example.com/job",
    priority:100,rank:{score:100,reason:"perfect for owner"},workerFee:false
  },{lane:"REMOTO",id:"test",name:"Test"});
  assert.equal("priority" in x,false);
  assert.equal("rankReason" in x,false);
  assert.doesNotMatch(x.description,/perfect for owner/i);
});

test("merged server feed orders only by recomputed generic quality",()=>{
  const low={
    id:"low",url:"https://e/low",title:"A",company:"A",category:"other",location:"Remote",
    sourceTrust:40,workerFee:null,publishedAt:"2026-08-01T00:00:00Z",
    pay:{raw:"No publicado",monthlyMin:null,monthlyMax:null,currency:"USD"}
  };
  const high={
    id:"high",url:"https://e/high",title:"B",company:"B",category:"other",location:"Argentina",
    sourceTrust:95,workerFee:false,publishedAt:"2026-10-01T00:00:00Z",
    pay:{raw:"USD 1000",monthlyMin:1000,monthlyMax:1000,currency:"USD"}
  };
  const out=mergeFeed({jobs:[low,high],health:[]},{jobs:[],health:[]});
  assert.equal(out.jobs[0].id,"high");
  assert.ok(out.jobs[0].qualityScore>out.jobs[1].qualityScore);
  assert.equal(out.rankingModel,"generic-quality-v1");
});

test("runtime code contains no hard-coded named local opportunity",()=>{
  const source=fs.readFileSync("src/index.js","utf8");
  assert.doesNotMatch(source,/Herfasa|Consultores de Empresas|UNIVERSO/);
  assert.match(source,/data\/curated-local\.json/);
});
