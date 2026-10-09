import test from "node:test";import assert from "node:assert/strict";import{classifyCategory,argentinaEligibility,scamAssessment,normalizeMonthlyPay,finalizeJob}from"../src/judge.js";import{parseSalaryText,DISCOVERY_SOURCES,SOURCE_REGISTRY,cleanHtml,safeUrl}from"../src/sources.js";
test("categoriza por función principal",()=>{assert.equal(classifyCategory({title:"Customer Success Specialist",description:""}),"customer-success");assert.equal(classifyCategory({title:"Travel Operations Assistant",description:"reservations"}),"travel");assert.equal(classifyCategory({title:"Executive Assistant",description:""}),"admin-va");});
test("Argentina y LatAm primero, restricciones regionales afuera",()=>{assert.equal(argentinaEligibility({location:"Argentina"}).score,100);assert.ok(argentinaEligibility({location:"Latin America"}).score>=90);assert.ok(argentinaEligibility({location:"Worldwide"}).score>=80);assert.ok(argentinaEligibility({location:"US only"}).score<=10);assert.ok(argentinaEligibility({location:"Remote (North America)"}).score<=10);});
test("señales de scam bajan confianza",()=>{const a=scamAssessment({sourceTrust:90,title:"Job",description:"No fees",company:"X"}),b=scamAssessment({sourceTrust:90,title:"Job",description:"Registration fee required, contact Telegram only",company:"X"});assert.ok(a.score>b.score);assert.equal(b.label,"Revisar");});
test("normaliza pagos",()=>{assert.equal(normalizeMonthlyPay({min:10,max:20,period:"hourly"}).monthlyMin,1600);assert.equal(normalizeMonthlyPay({min:12000,max:24000,period:"annual"}).monthlyMax,2000);assert.equal(parseSalaryText("$1,800 - $2,500 per month").monthlyMin,1800);assert.equal(parseSalaryText("Salary Range: USD 2,000–3,500 per month").monthlyMax,3500);});
test("limpia HTML",()=>assert.equal(cleanHtml("<script>x()</script><p>A &amp; B</p>"),"A & B"));
test("feed no depende de login Google ni Workers AI",()=>{assert.equal(Object.keys(SOURCE_REGISTRY).length,8);assert.ok(DISCOVERY_SOURCES.length>=8);const j=finalizeJob({title:"Customer Support",company:"A",location:"LatAm",description:"chat support",sourceTrust:90,workerFee:false,publishedAt:new Date().toISOString(),pay:normalizeMonthlyPay({min:1000,max:1200,period:"monthly"})});assert.ok(j.qualityScore>70);assert.equal("priority" in j,false);});

test("missing salary is null, never normalized to fabricated zero pay",()=>{
  const p=normalizeMonthlyPay({min:null,max:null,period:"annual",raw:"No publicado"});
  assert.equal(p.monthlyMin,null);
  assert.equal(p.monthlyMax,null);
  assert.equal(finalizeJob({title:"Analyst",company:"Example",location:"Argentina",sourceTrust:90,pay:p}).qualityComponents.compensationTransparency,45);
});
test("explicit Argentina exclusions override worldwide marketing copy",()=>{
  const r=argentinaEligibility({title:"Support",location:"Worldwide",description:"Remote worldwide except Argentina"});
  assert.equal(r.label,"No compatible");
});

test("WeRemoto HTML-escaped application URLs preserve real query parameters",()=>{
  const href=safeUrl("https://ar.talent.com/redirect?bpid=42&amp;falcon=1&amp;id=123");
  assert.equal(new URL(href).searchParams.get("bpid"),"42");
  assert.equal(new URL(href).searchParams.get("falcon"),"1");
  assert.equal(new URL(href).searchParams.get("id"),"123");
  assert.doesNotMatch(href,/&amp;/);
  assert.equal(safeUrl("javascript:alert(1)"),"");
});
