import test from "node:test";
import assert from "node:assert/strict";
import { handleMcpRequest } from "../src/mcp.js";

const jobs=[
  {
    id:"job-remote-1",lane:"REMOTO",title:"Marketing Specialist",company:"Acme",
    location:"Remote · Argentina",description:"Paid media and reporting",category:"marketing",
    url:"https://example.com/job-1",applicationMode:"cv",priority:90,
    argentina:{score:92,label:"Argentina/LatAm"},pay:{raw:"USD 1,500",monthlyMin:1500,monthlyMax:1500,currency:"USD"}
  },
  {
    id:"job-micro-1",lane:"REMOTO",title:"Landing page fix",company:"Telegram client",
    location:"Remote",description:"Small paid project",category:"tech",
    url:"https://t.me/example/42",directUrl:"https://web.telegram.org/a/#-1001",
    applicationMode:"direct",priority:75,argentina:{score:70,label:"A verificar"},
    pay:{raw:"USD 50",monthlyMin:null,monthlyMax:null,currency:"USD"}
  }
];

const context={
  getFeed:async()=>({
    version:"feed-v3",generatedAt:"2026-10-01T00:00:00Z",jobs,jobsCount:jobs.length,
    gptFindingsCount:2,health:[]
  }),
  getSources:async()=>({active:[],health:[],discovery:[],gptFiles:[]}),
  fetchText:async url=>url.includes("obra/superpowers")?"# Superpowers\nProcedural development skills.":"# Skill"
};

function post(payload){
  return handleMcpRequest(new Request("https://jobas.example/mcp",{
    method:"POST",
    headers:{"content-type":"application/json","accept":"application/json, text/event-stream"},
    body:JSON.stringify(payload)
  }),context);
}

test("MCP initialize mirrors the public ATM transport shape",async()=>{
  const r=await post({jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"test",version:"1"}}});
  assert.equal(r.status,200);
  const body=await r.json();
  assert.equal(body.result.protocolVersion,"2025-06-18");
  assert.equal(body.result.serverInfo.name,"JOBAS Public MCP");
  assert.equal(body.result.capabilities.tools.listChanged,false);
});

test("MCP supports ping and initialized notification",async()=>{
  const ping=await post({jsonrpc:"2.0",id:2,method:"ping",params:{}});
  assert.deepEqual((await ping.json()).result,{});
  const initialized=await post({jsonrpc:"2.0",method:"notifications/initialized",params:{}});
  assert.equal(initialized.status,202);
  assert.equal(await initialized.text(),"");
});

test("tools/list exposes public read-only JOBAS tools",async()=>{
  const r=await post({jsonrpc:"2.0",id:3,method:"tools/list",params:{}});
  const body=await r.json();
  const names=body.result.tools.map(x=>x.name);
  for(const name of ["agent_bootstrap","jobas_status","list_jobs","search_jobs","inspect_job","rank_jobs","list_microjobs","list_sources","research_zero_cost_catalog","research_github_readme","research_github_file","skill_list","skill_route","skill_get","mcp_status"]){
    assert.ok(names.includes(name),name);
  }
});

test("tools/call returns structured content and filters microjobs",async()=>{
  const r=await post({jsonrpc:"2.0",id:4,method:"tools/call",params:{name:"list_microjobs",arguments:{limit:10}}});
  const body=await r.json();
  assert.equal(body.result.isError,false);
  assert.equal(body.result.structuredContent.count,1);
  assert.equal(body.result.structuredContent.jobs[0].id,"job-micro-1");
  assert.equal(body.result.structuredContent.jobs[0].directUrl,"https://web.telegram.org/a/#-1001");
  assert.equal(JSON.parse(body.result.content[0].text).count,1);
});

test("skill router exposes install-free public skills without local runtimes",async()=>{
  const list=await post({jsonrpc:"2.0",id:5,method:"tools/call",params:{name:"skill_list",arguments:{}}});
  const listBody=await list.json();
  assert.ok(listBody.result.structuredContent.skills.some(x=>x.id==="superpowers"));
  const route=await post({jsonrpc:"2.0",id:6,method:"tools/call",params:{name:"skill_route",arguments:{task:"debug and test a code change",limit:3}}});
  const routeBody=await route.json();
  assert.equal(routeBody.result.structuredContent.skills[0].id,"superpowers");
  const get=await post({jsonrpc:"2.0",id:7,method:"tools/call",params:{name:"skill_get",arguments:{id:"superpowers"}}});
  const getBody=await get.json();
  assert.match(getBody.result.structuredContent.content,/Superpowers/);
});

test("zero-cost catalog classifies heavy runtimes instead of installing them in the Worker",async()=>{
  const r=await post({jsonrpc:"2.0",id:8,method:"tools/call",params:{name:"research_zero_cost_catalog",arguments:{}}});
  const body=await r.json();
  const byId=Object.fromEntries(body.result.structuredContent.items.map(x=>[x.id,x]));
  assert.equal(byId.superpowers.mode,"hosted-skill");
  assert.equal(byId.crawl4ai.mode,"external-heavy");
  assert.equal(byId["laya-cpp"].mode,"external-runtime");
});

test("GET is method-not-allowed and unsupported RPC methods return -32601",async()=>{
  const get=await handleMcpRequest(new Request("https://jobas.example/mcp"),context);
  assert.equal(get.status,405);
  const bad=await post({jsonrpc:"2.0",id:9,method:"resources/list",params:{}});
  const body=await bad.json();
  assert.equal(body.error.code,-32601);
});
