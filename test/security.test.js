import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
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


test("Cloudflare static assets receive the same security policy without forcing Worker execution",()=>{
  const headers=fs.readFileSync("public/_headers","utf8");
  assert.match(headers,/Content-Security-Policy:/);
  assert.match(headers,/connect-src 'self' https:\/\/openrouter\.ai/);
  assert.match(headers,/X-Frame-Options: DENY/);
  assert.match(headers,/X-Content-Type-Options: nosniff/);
  assert.match(headers,/Strict-Transport-Security:/);
});
