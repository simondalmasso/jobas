// Real production browser acceptance. No mocked feed, no candidate uploads, no provider keys.
// Run explicitly: npm run test:live-browser (never part of deterministic CI).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawn} from "node:child_process";
import assert from "node:assert/strict";

const ORIGIN=process.env.JOBAS_TEST_ORIGIN||"https://jobas.simondalmasso44.workers.dev";
const CDP_PORT=9444;
const errors=[];
const failures=[];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(name,condition,details="")=>{
  console.log(`${name}=${condition?"PASS":"FAIL"}${condition?"":" "+details}`);
  if(!condition)failures.push(name);
};
function chromePath(){
  return [process.env.CHROME_PATH,"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome","/usr/bin/chromium"].find(x=>x&&fs.existsSync(x));
}
class CDP {
  constructor(url){this.url=url;this.id=0;this.pending=new Map();}
  async open(){
    this.ws=new WebSocket(this.url);
    await new Promise((yes,no)=>{this.ws.addEventListener("open",yes,{once:true});this.ws.addEventListener("error",no,{once:true});});
    this.ws.addEventListener("message",e=>{
      const msg=JSON.parse(e.data);
      if(msg.id&&this.pending.has(msg.id)){
        const p=this.pending.get(msg.id);this.pending.delete(msg.id);
        msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result);
      }else if(msg.method==="Runtime.exceptionThrown"){
        errors.push("exception:"+String(msg.params?.exceptionDetails?.text||"unknown"));
      }else if(msg.method==="Runtime.consoleAPICalled"&&msg.params?.type==="error"){
        errors.push("console:"+JSON.stringify(msg.params.args||[]));
      }else if(msg.method==="Log.entryAdded"&&msg.params?.entry?.level==="error"){
        errors.push("log:"+msg.params.entry.text);
      }
    });
  }
  send(method,params={}){
    const id=++this.id;
    return new Promise((yes,no)=>{this.pending.set(id,{resolve:yes,reject:no});this.ws.send(JSON.stringify({id,method,params}));});
  }
  async eval(expression){
    const r=await this.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true,userGesture:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.text||"evaluate failed");
    return r.result?.value;
  }
  close(){try{this.ws.close()}catch{}}
}
const base=new URL(ORIGIN);
const [home,health,feed,mcpGet]=await Promise.all([
  fetch(base),fetch(new URL("/api/health",base)),fetch(new URL("/api/feed",base)),
  fetch(new URL("/mcp",base))
]);
const liveFeed=await feed.json();
check("LIVE_HOME_HTTP",home.ok);
check("LIVE_HEALTH",health.ok);
check("LIVE_FEED",feed.ok&&Array.isArray(liveFeed.jobs)&&liveFeed.jobs.length>0);
check("LIVE_MCP_GET_405",mcpGet.status===405);
check("LIVE_HEADERS",["content-security-policy","strict-transport-security","x-content-type-options","x-frame-options","referrer-policy"].every(k=>home.headers.get(k)),JSON.stringify(Object.fromEntries(home.headers)));
check("LIVE_FEED_HEALTH_COUNTS",(await health.json()).jobsCount===liveFeed.jobs.length,"health and merged feed count diverge");

const mcpHeaders={"content-type":"application/json","accept":"application/json, text/event-stream"};
const mcpInit=await fetch(new URL("/mcp",base),{method:"POST",headers:mcpHeaders,body:JSON.stringify({jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"jobas-product-auditor",version:"1.0"}}})});
check("LIVE_MCP_INITIALIZE",mcpInit.ok);
const mcpTools=await fetch(new URL("/mcp",base),{method:"POST",headers:mcpHeaders,body:JSON.stringify({jsonrpc:"2.0",id:2,method:"tools/list",params:{}})});
const toolText=await mcpTools.text();
check("LIVE_MCP_TOOLS",mcpTools.ok&&toolText.includes("list_jobs")&&toolText.includes("search_jobs"));
check("LIVE_MCP_READONLY_NAMES",!/\b(create_job|delete_job|update_job|write_file|exec_shell)\b/.test(toolText));

const chromeExe=chromePath();
if(!chromeExe)throw Error("Chrome not found");
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"jobas-live-"));
const chrome=spawn(chromeExe,["--headless=new",`--remote-debugging-port=${CDP_PORT}`,`--user-data-dir=${profile}`,"--no-sandbox","--disable-gpu","about:blank"],{stdio:"ignore"});
let cdp=null,tab=null;
try{
  let ready=false;
  for(let i=0;i<80;i++){try{ready=(await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).ok;if(ready)break;}catch{}await sleep(125);}
  check("LIVE_CHROME_CDP",ready);
  tab=await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`,{method:"PUT"})).json();
  cdp=new CDP(tab.webSocketDebuggerUrl);await cdp.open();
  for(const method of ["Page.enable","Runtime.enable","Log.enable","Network.enable"])await cdp.send(method);
  await cdp.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false,screenWidth:1440,screenHeight:900});
  await cdp.send("Page.navigate",{url:ORIGIN});
  await sleep(1700);
  await cdp.eval("localStorage.clear();sessionStorage.clear();location.reload()");
  await sleep(1400);
  let initial=await cdp.eval('({profile:localStorage.getItem("jobas:profile:v1"),coach:document.querySelector("#actionCoach")?.disabled})');
  check("LIVE_ANONYMOUS_BROWSE",!initial.profile&&initial.coach===true);
  await cdp.eval('document.querySelector("#actionOffers").click()');
  await sleep(350);
  let count=await cdp.eval('document.querySelectorAll("#feed .job").length');
  check("LIVE_REMOTE_OPPORTUNITIES",count>0,`rendered=${count}`);
  const firstTitle=await cdp.eval('document.querySelector("#feed .job .job-title")?.textContent||""');
  await cdp.eval('(()=>{const q=document.querySelector("#q");q.value="jobas-no-such-live-vacancy-20261009";q.dispatchEvent(new Event("input",{bubbles:true}))})()');
  check("LIVE_SEARCH_EMPTY",await cdp.eval('document.querySelectorAll("#feed .job").length===0 && /No hay resultados/.test(document.querySelector("#feed").textContent)'));
  await cdp.eval(`(()=>{const q=document.querySelector("#q");q.value=${JSON.stringify(firstTitle)};q.dispatchEvent(new Event("input",{bubbles:true}))})()`);
  check("LIVE_SEARCH_REAL",await cdp.eval('document.querySelectorAll("#feed .job").length>=1'));
  await cdp.eval(`(()=>{const q=document.querySelector("#q");q.value="";q.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector('#offersWindow [data-mode="local"]').click()})()`);
  await sleep(100);
  check("LIVE_LOCAL_OPPORTUNITIES",await cdp.eval('document.querySelectorAll("#feed .job").length>0'));
  await cdp.eval(`document.querySelector('#offersWindow [data-mode="remote"]').click()`);
  await sleep(100);
  check("LIVE_ARGENTINA_FILTER",await cdp.eval('[...document.querySelectorAll("#feed .job")].every(el=>!el.textContent.includes("A verificar"))'));
  await cdp.eval('(()=>{document.querySelector("#profileEditor").open=true;document.querySelector("#profileNameInput").value="Product QA";document.querySelector("#profileRolesInput").value="Customer Success";document.querySelector("#profileHeadlineInput").value="QA";document.querySelector("#profileLocationInput").value="Argentina";document.querySelector(\'input[name="modes"][value="remote"]\').checked=true;document.querySelector("#profileForm").requestSubmit()})()');
  await sleep(200);
  check("LIVE_PROFILE_STORED",await cdp.eval('JSON.parse(localStorage.getItem("jobas:profile:v1")||"null")?.name==="Product QA"'));
  await cdp.eval('document.querySelector("#feed .job [data-action=favorite]").click()');
  await sleep(160);
  check("LIVE_FAVORITES",await cdp.eval('JSON.parse(localStorage.getItem("jobas:favorites:v1")||"[]").length===1'));
  await cdp.eval('document.querySelector("#feed .job [data-action=progress]").click()');
  await sleep(160);
  check("LIVE_APPLICATION_TRACKING",await cdp.eval('JSON.parse(localStorage.getItem("jobas:in-progress:v1")||"[]").length===1'));
  await cdp.eval('(()=>{window.prompt=()=>"QA Remote";document.querySelector("#saveSearch").click();document.querySelector("#newFolderName").value="QA Folder";document.querySelector("#addFolder").click()})()');
  await sleep(200);
  check("LIVE_SEARCH_AND_FOLDER",await cdp.eval('JSON.parse(localStorage.getItem("jobas:searches:v1")||"[]").length===1 && JSON.parse(localStorage.getItem("jobas:folders:v1")||"[]").length===1'));
  await cdp.eval('location.reload()');
  await sleep(1500);
  check("LIVE_RELOAD_PERSISTENCE",await cdp.eval('JSON.parse(localStorage.getItem("jobas:profile:v1")||"null")?.name==="Product QA" && JSON.parse(localStorage.getItem("jobas:favorites:v1")||"[]").length===1 && JSON.parse(localStorage.getItem("jobas:in-progress:v1")||"[]").length===1'));
  await cdp.eval('document.querySelector("#actionCoach").click();document.querySelector("#pennyLauncher").click()');
  await sleep(100);
  check("LIVE_AI_DISCONNECTED",await cdp.eval('document.querySelector("#coachProviderStatus").textContent.includes("No conectada") && !sessionStorage.getItem("jobas:openrouter:key:session") && !localStorage.getItem("jobas:openrouter:key:local")'));
  check("LIVE_PENNY_PRESENT",await cdp.eval('!document.querySelector("#pennyWindow").hidden && document.querySelector(".penny-avatar").naturalWidth>0'));
  for(const [width,height,mobile] of [[390,844,true],[360,800,true],[1440,900,false]]){
    await cdp.send("Emulation.setDeviceMetricsOverride",{width,height,screenWidth:width,screenHeight:height,deviceScaleFactor:1,mobile});
    await sleep(175);
    const v=await cdp.eval('({scroll:document.documentElement.scrollWidth,width:innerWidth,feed:document.querySelectorAll("#feed .job").length})');
    check(`LIVE_VIEWPORT_${width}`,v.scroll<=v.width&&v.feed>0,JSON.stringify(v));
  }
  check("LIVE_CONSOLE_ERRORS_ZERO",errors.length===0,errors.join("|"));
}finally{
  try{cdp?.close()}catch{}
  try{if(tab?.id)await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${tab.id}`)}catch{}
  try{chrome.kill("SIGKILL")}catch{}
  await sleep(250);
  await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:250}).catch(()=>{});
}
if(failures.length)throw Error("LIVE_ACCEPTANCE=HOLD failures: "+failures.join(","));
console.log("LIVE_ACCEPTANCE=PASS");
