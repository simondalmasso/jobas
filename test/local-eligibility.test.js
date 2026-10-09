import test from "node:test";
import assert from "node:assert/strict";
import {loadCuratedFindings} from "../src/index.js";

test("Santa Fe curated jobs explicitly identify Argentina and pass the default local filter",()=>{
  const local=loadCuratedFindings().jobs.filter(job=>job.lane==="LOCAL");
  assert.ok(local.length>=1);
  for(const job of local){
    assert.match(job.location,/Argentina/);
    assert.ok(job.argentina.score>=80,job.id+" was hidden by the local Argentina filter");
  }
});
