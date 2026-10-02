import test from "node:test";
import assert from "node:assert/strict";
import { createUserMemory } from "../public/user-memory.js";

test("user memory stores favorites, searches and custom folders locally",()=>{
  const map=new Map();
  const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  const mem=createUserMemory(storage);
  mem.toggleFavorite({id:"1",title:"Role",company:"Acme"});
  assert.equal(mem.favorites().length,1);
  mem.saveSearch({name:"CX remoto",query:"customer success",mode:"remote"});
  assert.equal(mem.searches().length,1);
  const folder=mem.addFolder("Empresas A");
  assert.equal(folder.name,"Empresas A");
  mem.addToFolder(folder.id,{id:"1",title:"Role",company:"Acme"});
  assert.equal(mem.folders()[0].items.length,1);
});