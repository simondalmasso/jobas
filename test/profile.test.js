import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProfile, profileComplete, createProfileStore } from "../public/profile.js";

test("profile requires name, a target role and one work mode",()=>{
  assert.equal(profileComplete({}),false);
  assert.equal(profileComplete({name:"Ana",targetRoles:["Customer Success"],modes:["remote"]}),true);
});

test("profile normalization removes empty values and unknown modes",()=>{
  const p=normalizeProfile({
    name:" Ana ",
    targetRoles:[" Customer Success ",""],
    modes:["remote","unknown","local"],
    skills:" Salesforce, CRM, ",
    languages:["Español",""]
  });
  assert.equal(p.name,"Ana");
  assert.deepEqual(p.targetRoles,["Customer Success"]);
  assert.deepEqual(p.modes,["remote","local"]);
  assert.deepEqual(p.skills,["Salesforce","CRM"]);
  assert.deepEqual(p.languages,["Español"]);
});

test("profile store persists browser-local state only",()=>{
  const map=new Map();
  const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
  const store=createProfileStore(storage);
  store.save({name:"Ana",targetRoles:["CX"],modes:["remote"]});
  assert.equal(store.load().name,"Ana");
  store.clear();
  assert.equal(store.load().name,"");
});