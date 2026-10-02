import test from "node:test";
import assert from "node:assert/strict";
import {
  buildOpenRouterAuthUrl,
  createCredentialStore,
  sendCoachMessage,
  extractProfileFromCv,
  buildInterviewSystemPrompt
} from "../public/coach.js";

test("OAuth URL uses OpenRouter PKCE S256 and state",()=>{
  const url=new URL(buildOpenRouterAuthUrl({
    callbackUrl:"https://jobas.web.app/",
    challenge:"abc",
    state:"state123"
  }));
  assert.equal(url.origin,"https://openrouter.ai");
  assert.equal(url.pathname,"/auth");
  assert.equal(url.searchParams.get("code_challenge"),"abc");
  assert.equal(url.searchParams.get("code_challenge_method"),"S256");
  assert.equal(url.searchParams.get("state"),"state123");
  assert.equal(url.searchParams.get("key_label"),"JOBAS Coach");
});

test("credential store defaults to session storage",()=>{
  const sessionMap=new Map(), localMap=new Map();
  const session={getItem:k=>sessionMap.get(k)??null,setItem:(k,v)=>sessionMap.set(k,v),removeItem:k=>sessionMap.delete(k)};
  const local={getItem:k=>localMap.get(k)??null,setItem:(k,v)=>localMap.set(k,v),removeItem:k=>localMap.delete(k)};
  const store=createCredentialStore({sessionStorage:session,localStorage:local});
  store.set("sk-user",false);
  assert.equal(sessionMap.size,1);
  assert.equal(localMap.size,0);
  assert.equal(store.get(),"sk-user");
});

test("coach request goes directly to OpenRouter, never JOBAS Worker",async()=>{
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push({url:String(url),options});
    return {ok:true,json:async()=>({choices:[{message:{content:"Respuesta"}}]})};
  };
  const out=await sendCoachMessage({
    apiKey:"sk-user",
    model:"openrouter/free",
    messages:[{role:"user",content:"Hola"}],
    fetchImpl
  });
  assert.equal(out.content,"Respuesta");
  assert.equal(calls.length,1);
  assert.equal(new URL(calls[0].url).origin,"https://openrouter.ai");
  assert.doesNotMatch(calls[0].url,/workers\.dev|web\.app/);
});

test("PDF profile extraction sends the private file directly to OpenRouter",async()=>{
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push({url:String(url),body:JSON.parse(options.body)});
    return {ok:true,json:async()=>({choices:[{message:{content:'{"name":"Ana","targetRoles":["CX"],"modes":["remote"],"skills":["CRM"],"languages":["Español"]}'}}]})};
  };
  const profile=await extractProfileFromCv({
    apiKey:"sk-user",
    model:"openrouter/free",
    file:{name:"cv.pdf",type:"application/pdf"},
    dataUrl:"data:application/pdf;base64,AAAA",
    fetchImpl
  });
  assert.equal(profile.name,"Ana");
  assert.equal(new URL(calls[0].url).origin,"https://openrouter.ai");
  assert.equal(calls[0].body.messages[0].content[1].type,"file");
});

test("interview prompt uses profile and selected job without inventing experience",()=>{
  const prompt=buildInterviewSystemPrompt({
    profile:{name:"Ana",targetRoles:["Customer Success"],skills:["Salesforce"]},
    job:{title:"CS Specialist",company:"Acme",description:"Onboarding"}
  });
  assert.match(prompt,/Ana/);
  assert.match(prompt,/CS Specialist/);
  assert.match(prompt,/no invent/i);
});