import test from "node:test";
import assert from "node:assert/strict";
import {refresh} from "../src/index.js";

function kv(initial=null){
  let value=initial&&JSON.stringify(initial);
  return {async get(){return value},async put(_,next){value=next}};
}
const OLD={generatedAt:"2026-10-08T12:00:00Z",jobsCount:1,jobs:[{id:"old",title:"Opportunity",company:"Example"}],health:[{source:"source",state:"healthy"}]};
test("all-source failure retains prior snapshot without falsifying freshness",async()=>{
  const env={FEED_LIMIT:"320",JOBAS_FEED:kv(OLD)};
  const state=await refresh(env,async()=>({jobs:[],health:[{source:"source",state:"degraded",jobs:0}]}));
  assert.equal(state.stale,true);
  assert.equal(state.jobsCount,1);
  assert.equal(state.jobs[0].id,"old");
  assert.equal(state.generatedAt,OLD.generatedAt);
  assert.equal(state.lastSuccessfulRefreshAt,OLD.generatedAt);
  assert.equal(state.health[0].state,"degraded");
  assert.match(state.refreshFailureAt,/^\d{4}-/);
  assert.equal(JSON.parse(await env.JOBAS_FEED.get()).stale,true);
});
test("successful source recovery replaces stale state",async()=>{
  const env={JOBAS_FEED:kv({...OLD,stale:true})};
  const fresh={jobs:[{id:"new"}],jobsCount:1,generatedAt:"2026-10-09T12:00:00Z",health:[{source:"source",state:"healthy"}]};
  const state=await refresh(env,async()=>fresh);
  assert.equal(state.stale,false);
  assert.equal(state.jobs[0].id,"new");
  assert.equal(state.lastSuccessfulRefreshAt,fresh.generatedAt);
  assert.equal(state.refreshFailureAt,null);
});
