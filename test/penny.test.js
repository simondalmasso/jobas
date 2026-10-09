import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {createPennyCredentialStore,sendPennyMessage,buildPennySystemPrompt} from "../public/penny.js";

test("Penny guarda token en sesión por defecto",()=>{
 const a=new Map(),b=new Map();
 const sessionStorage={getItem:k=>a.get(k)??null,setItem:(k,v)=>a.set(k,v),removeItem:k=>a.delete(k)};
 const localStorage={getItem:k=>b.get(k)??null,setItem:(k,v)=>b.set(k,v),removeItem:k=>b.delete(k)};
 const s=createPennyCredentialStore({sessionStorage,localStorage});
 s.set("hf_user");
 assert.equal(s.get(),"hf_user");
 assert.equal(b.size,0);
});

test("Penny llama directo al router de Hugging Face",async()=>{
 const calls=[];
 const fetchImpl=async(url,options)=>{calls.push({url:String(url),options});return{ok:true,json:async()=>({choices:[{message:{content:"Hola"}}]})};};
 const out=await sendPennyMessage({token:"hf_user",messages:[{role:"user",content:"hola"}],fetchImpl});
 assert.equal(out.content,"Hola");
 assert.equal(new URL(calls[0].url).origin,"https://router.huggingface.co");
 assert.doesNotMatch(calls[0].url,/workers\.dev|web\.app/);
});

test("prompt de Penny usa contexto sin prometer acciones",()=>{
 const p=buildPennySystemPrompt({profile:{targetRoles:["CX"],modes:["remote"],skills:["CRM"]},jobs:[{title:"Support",company:"Acme"}]});
 assert.match(p,/Penny/);
 assert.match(p,/CX/);
 assert.match(p,/Support/);
 assert.match(p,/No digas que aplicaste/i);
});

test("CSP permite solo el router de Hugging Face requerido por Penny",()=>{
 const headers=fs.readFileSync("public/_headers","utf8");
 assert.match(headers,/connect-src[^\n]*https:\/\/router\.huggingface\.co/);
 assert.doesNotMatch(headers,/connect-src[^\n]*\*/);
});

test("Penny can reuse OpenRouter free router directly, without the Worker",async()=>{
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push({url:String(url),headers:options.headers,body:JSON.parse(options.body)});
    return{ok:true,json:async()=>({choices:[{message:{content:"Hola desde modelo gratis"}}]})};
  };
  const out=await sendPennyMessage({provider:"openrouter",token:"sk-or-user",messages:[{role:"user",content:"Hola"}],fetchImpl});
  assert.equal(out.content,"Hola desde modelo gratis");
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,"https://openrouter.ai/api/v1/chat/completions");
  assert.equal(calls[0].body.model,"openrouter/free");
  assert.equal(calls[0].headers.Authorization,"Bearer sk-or-user");
  assert.doesNotMatch(calls[0].url,/workers\.dev|web\.app/);
});

test("Penny free route never silently switches to a paid model on API errors",async()=>{
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push(JSON.parse(options.body));
    return {ok:false,status:429,json:async()=>({error:{message:"Quota exceeded"}})};
  };
  await assert.rejects(sendPennyMessage({provider:"openrouter",token:"sk-or-user",messages:[{role:"user",content:"Hola"}],fetchImpl}),/Quota exceeded/);
  assert.equal(calls.length,1);
  assert.equal(calls[0].model,"openrouter/free");
});

test("Penny does not make network requests if chosen provider is disconnected",async()=>{
  let called=0;
  await assert.rejects(sendPennyMessage({provider:"openrouter",token:"",messages:[],fetchImpl:async()=>{called++}}),/OPENROUTER_NOT_CONNECTED/);
  assert.equal(called,0);
});
