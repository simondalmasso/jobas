import test from "node:test";
import assert from "node:assert/strict";
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