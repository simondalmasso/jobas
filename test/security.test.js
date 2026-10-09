import test from "node:test";
import assert from "node:assert/strict";
import worker,{SECURITY_HEADERS} from "../src/index.js";

function kv(initial={}){
  const store=new Map(Object.entries(initial));
  return{
    async get(k){return store.get(k)??null;},
    async put(k,v){store.set(k,v);}
  };
}

test("security headers are strict and CSP allows only JOBAS + OpenRouter connection",()=>{
  const csp=SECURITY_HEADERS["content-security-policy"];
  assert.match(csp,/default-src 'self'/);
  assert.match(csp,/script-src 'self'/);
  assert.match(csp,/style-src 'self'/);
  assert.match(csp,/connect-src 'self' https:\/\/openrouter\.ai/);
  assert.match(csp,/object-src 'none'/);
  assert.match(csp,/base-uri 'none'/);
  assert.match(csp,/frame-ancestors 'none'/);
  assert.doesNotMatch(csp,/\*/);
  assert.doesNotMatch(csp,/unsafe-eval/);
  assert.equal(SECURITY_HEADERS["x-content-type-options"],"nosniff");
  assert.equal(SECURITY_HEADERS["x-frame-options"],"DENY");
  assert.ok(SECURITY_HEADERS["referrer-policy"]);
  assert.ok(SECURITY_HEADERS["permissions-policy"]);
  assert.match(SECURITY_HEADERS["strict-transport-security"],/max-age=/);
});

test("API health counts the full public feed including curated opportunities",async()=>{
  const feed={version:"feed-v4",generatedAt:"2026-10-08T12:00:00Z",jobsCount:1,jobs:[{
    id:"base1",title:"Analyst",company:"Example",url:"https://example.com/a",sourceTrust:90,
    location:"Argentina",pay:{raw:"No publicado",monthlyMin:null,monthlyMax:null}
  }],health:[]};
  const env={
    JOBAS_FEED:kv({"feed:v2":JSON.stringify(feed)}),
    ASSETS:{fetch:async()=>new Response("")}
  };
  const health=await (await worker.fetch(new Request("https://jobas.example/api/health"),env)).json();
  const full=await (await worker.fetch(new Request("https://jobas.example/api/feed"),env)).json();
  assert.equal(health.jobsCount,full.jobsCount);
  assert.equal(health.jobsCount,full.jobs.length);
});
test("static responses and API health receive hardening headers",async()=>{
  const env={
    JOBAS_FEED:kv(),
    ASSETS:{fetch:async()=>new Response("<!doctype html>",{headers:{"content-type":"text/html"}})}
  };
  for(const url of ["https://jobas.example/","https://jobas.example/api/health"]){
    const r=await worker.fetch(new Request(url),env);
    assert.equal(r.headers.get("x-content-type-options"),"nosniff");
    assert.equal(r.headers.get("x-frame-options"),"DENY");
    assert.match(r.headers.get("content-security-policy")||"",/frame-ancestors 'none'/);
    assert.ok(r.headers.get("strict-transport-security"));
  }
});
