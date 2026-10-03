import test from "node:test";
import assert from "node:assert/strict";
import { personalFitScore, sortByPersonalFit } from "../public/fit.js";

test("personal fit uses browser profile signals, not server quality",()=>{
  const profile={targetRoles:["Customer Success"],skills:["Salesforce"],modes:["remote"]};
  const strong={lane:"REMOTO",title:"Customer Success Specialist",description:"Salesforce onboarding",qualityScore:40};
  const generic={lane:"REMOTO",title:"Backend Engineer",description:"Go services",qualityScore:99};
  assert.ok(personalFitScore(strong,profile)>personalFitScore(generic,profile));
  assert.equal(sortByPersonalFit([generic,strong],profile)[0],strong);
});

test("work mode incompatibility does not receive mode points",()=>{
  const profile={targetRoles:["Marketing"],skills:[],modes:["remote"]};
  const local={lane:"LOCAL",title:"Marketing",description:"",qualityScore:90};
  const remote={lane:"REMOTO",title:"Marketing",description:"",qualityScore:20};
  assert.ok(personalFitScore(remote,profile)>personalFitScore(local,profile));
});
