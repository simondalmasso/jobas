import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawn} from "node:child_process";

const HOST="127.0.0.1";
const PORT=8799;
const CDP_PORT=9333;
const root=path.resolve("public");
const requests=[];
const errors=[];
const results=new Map();

const mockFeed={
  version:"feed-v4",
  rankingModel:"generic-quality-v1",
  generatedAt:"2026-10-03T12:00:00Z",
  jobsCount:2,
  jobs:[
    {
      id:"qa-remote-1",lane:"REMOTO",title:"Customer Success Specialist",company:"Acme",
      location:"Argentina · Remote",description:"Onboarding, CRM and customer support",category:"customer-success",
      sourceName:"QA Source",sourceUrl:"https://example.com",sourceDetail:"https://example.com/jobs/1",
      url:"https://example.com/jobs/1",applicationMode:"cv",qualityScore:92,
      argentina:{score:100,label:"Argentina",reason:"QA"},scam:{score:95,label:"Buena señal",reasons:[]},
      pay:{raw:"USD 1,500 / month",monthlyMin:1500,monthlyMax:1500,currency:"USD"}
    },
    {
      id:"qa-local-1",lane:"LOCAL",title:"Soporte Comercial",company:"Local Co",
      location:"Santa Fe, Argentina",description:"Atención digital y CRM",category:"support",
      sourceName:"QA Source",sourceUrl:"https://example.com",sourceDetail:"https://example.com/jobs/2",
      url:"https://example.com/jobs/2",applicationMode:"cv",qualityScore:88,
      argentina:{score:100,label:"Argentina",reason:"QA"},scam:{score:95,label:"Buena señal",reasons:[]},
      pay:{raw:"No publicado",monthlyMin:null,monthlyMax:null,currency:"ARS"}
    }
  ],
  health:[],
  discoverySources:[]
};

const MIME={
  ".html":"text/html; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".svg":"image/svg+xml",
  ".png":"image/png"
};
const CSP="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://openrouter.ai; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'self'; form-action 'self'";

const server=http.createServer((req,res)=>{
  requests.push({method:req.method,url:req.url});
  if(req.url?.startsWith("/api/feed")){
    res.writeHead(200,{"content-type":"application/json","content-security-policy":CSP});
    res.end(JSON.stringify(mockFeed));
    return;
  }
  if(req.url?.startsWith("/api/sources")){
    res.writeHead(200,{"content-type":"application/json","content-security-policy":CSP});
    res.end(JSON.stringify({active:[],health:[],discovery:[],dataFiles:[]}));
    return;
  }
  let pathname=(req.url||"/").split("?")[0];
  if(pathname==="/")pathname="/index.html";
  const file=path.join(root,pathname.replace(/^\//,""));
  if(!file.startsWith(root)||!fs.existsSync(file)){
    res.writeHead(404);res.end("not found");return;
  }
  res.writeHead(200,{
    "content-type":MIME[path.extname(file)]||"application/octet-stream",
    "cache-control":"no-store",
    "content-security-policy":CSP
  });
  fs.createReadStream(file).pipe(res);
});

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function chromePath(){
  const candidates=[
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter(Boolean);
  return candidates.find(fs.existsSync)||"";
}
async function waitForCdp(){
  for(let i=0;i<80;i++){
    try{
      const r=await fetch("http://"+HOST+":"+CDP_PORT+"/json/version");
      if(r.ok)return r.json();
    }catch{}
    await sleep(125);
  }
  throw new Error("Chrome CDP did not start");
}
class CDP{
  constructor(url){this.url=url;this.id=0;this.pending=new Map();}
  async open(){
    this.ws=new WebSocket(this.url);
    await new Promise((resolve,reject)=>{
      this.ws.addEventListener("open",resolve,{once:true});
      this.ws.addEventListener("error",reject,{once:true});
    });
    this.ws.addEventListener("message",event=>{
      const msg=JSON.parse(event.data);
      if(msg.id&&this.pending.has(msg.id)){
        const p=this.pending.get(msg.id);this.pending.delete(msg.id);
        msg.error?p.reject(new Error(JSON.stringify(msg.error))):p.resolve(msg.result);
      }else if(msg.method==="Runtime.exceptionThrown"){
        errors.push("exception:"+JSON.stringify(msg.params?.exceptionDetails?.exception?.description||msg.params?.exceptionDetails?.text||"unknown"));
      }else if(msg.method==="Log.entryAdded"&&msg.params?.entry?.level==="error"){
        errors.push("log:"+msg.params.entry.text);
      }else if(msg.method==="Runtime.consoleAPICalled"&&msg.params?.type==="error"){
        errors.push("console:"+JSON.stringify(msg.params.args||[]));
      }
    });
  }
  send(method,params={}){
    const id=++this.id;
    return new Promise((resolve,reject)=>{
      this.pending.set(id,{resolve,reject});
      this.ws.send(JSON.stringify({id,method,params}));
    });
  }
  async eval(expression){
    const out=await this.send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true,userGesture:true});
    if(out.exceptionDetails)throw new Error(out.exceptionDetails.text||"evaluate failed");
    return out.result?.value;
  }
  close(){try{this.ws.close();}catch{}}
}
function check(name,condition,detail=""){
  results.set(name,Boolean(condition));
  if(!condition)throw new Error(name+"=FAIL "+detail);
  process.stdout.write(name+"=PASS\n");
}

await new Promise((resolve,reject)=>{
  server.once("error",reject);
  server.listen(PORT,HOST,resolve);
});

const executable=chromePath();
if(!executable){
  server.close();
  throw new Error("No Chrome/Chromium executable found; set CHROME_PATH");
}
const userData=fs.mkdtempSync(path.join(os.tmpdir(),"jobas-browser-"));
const chrome=spawn(executable,[
  "--headless=new",
  "--remote-debugging-port="+CDP_PORT,
  "--user-data-dir="+userData,
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--no-sandbox",
  "about:blank"
],{stdio:"ignore"});

let cdp,tab;
try{
  await waitForCdp();
  tab=await (await fetch("http://"+HOST+":"+CDP_PORT+"/json/new?about:blank",{method:"PUT"})).json();
  cdp=new CDP(tab.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false,screenWidth:1440,screenHeight:900});
  await cdp.send("Page.navigate",{url:"http://"+HOST+":"+PORT+"/"});
  await sleep(900);

  await cdp.eval("localStorage.clear();sessionStorage.clear();location.reload()");
  await sleep(700);

  const initial=await cdp.eval('({profile:localStorage.getItem("jobas:profile:v1"),incomplete:document.querySelector("#profileState")?.textContent,coachDisabled:document.querySelector("#actionCoach")?.disabled})');
  await cdp.eval('document.querySelector("#actionOffers").click()');
  await sleep(120);
  const publicJobs=await cdp.eval('document.querySelectorAll("#feed .job").length');
  check("PUBLIC_BROWSE_NO_PROFILE",!initial.profile&&/INCOMPLETO/.test(initial.incomplete)&&initial.coachDisabled&&publicJobs>0);

  await cdp.eval('(()=>{document.querySelector(\'[data-window-open="profile"]\').click();document.querySelector("#profileEditor").open=true;document.querySelector("#profileNameInput").value="QA User";document.querySelector("#profileHeadlineInput").value="Customer Success";document.querySelector("#profileLocationInput").value="Argentina";document.querySelector("#profileRolesInput").value="Customer Success";document.querySelector("#profileSkillsInput").value="CRM, Salesforce";document.querySelector(\'input[name="modes"][value="remote"]\').checked=true;document.querySelector("#profileForm").requestSubmit();})()');
  await sleep(120);
  const profile=await cdp.eval('({state:document.querySelector("#profileState")?.textContent,stored:JSON.parse(localStorage.getItem("jobas:profile:v1")||"null")})');
  check("PROFILE_CREATE",/LISTO/.test(profile.state)&&profile.stored?.name==="QA User");
  check("PROFILE_LOCAL_ONLY",requests.every(x=>!/^\/api\/(profile|user|account)/.test(x.url||"")));

  await cdp.eval('document.querySelector("#actionOffers").click()');
  await sleep(80);
  await cdp.eval('document.querySelector("#feed .job [data-action=favorite]").click()');
  await sleep(80);
  const favs=await cdp.eval('JSON.parse(localStorage.getItem("jobas:favorites:v1")||"[]").length');
  check("FAVORITE",favs===1);

  await cdp.eval('(()=>{const q=document.querySelector("#q");q.value="Customer";q.dispatchEvent(new Event("input",{bubbles:true}));window.prompt=()=>"QA Search";document.querySelector("#saveSearch").click();})()');
  await sleep(80);
  const searches=await cdp.eval('JSON.parse(localStorage.getItem("jobas:searches:v1")||"[]").length');
  check("SAVE_SEARCH",searches===1);

  await cdp.eval('document.querySelector("#feed .job [data-action=progress]").click()');
  await sleep(80);
  const tracked=await cdp.eval('JSON.parse(localStorage.getItem("jobas:in-progress:v1")||"[]").length');
  check("APPLICATION_TRACKING",tracked===1);

  await cdp.eval('document.querySelector("#actionCoach").click()');
  await sleep(80);
  const coachState=await cdp.eval('({visible:!document.querySelector("#coachWindow").hidden,status:document.querySelector("#coachProviderStatus").textContent,connectVisible:!document.querySelector("#coachConnect").hidden,sessionKey:sessionStorage.getItem("jobas:openrouter:key:session"),localKey:localStorage.getItem("jobas:openrouter:key:local")})');
  check("COACH_DISCONNECTED_STATE",coachState.visible&&/No conectada/.test(coachState.status)&&coachState.connectVisible&&!coachState.sessionKey&&!coachState.localKey);

  await cdp.send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true,screenWidth:390,screenHeight:844});
  await cdp.eval('document.querySelector(\'[data-window-open="profile"]\').click()');
  await sleep(120);
  const mobile=await cdp.eval('({scroll:document.documentElement.scrollWidth,width:innerWidth,profile:!document.querySelector("#profileWindow").hidden})');
  check("MOBILE_390",mobile.scroll<=mobile.width&&mobile.profile,"scroll="+mobile.scroll+" width="+mobile.width);

  await cdp.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false,screenWidth:1440,screenHeight:900});
  await sleep(100);
  const desktop=await cdp.eval('({scroll:document.documentElement.scrollWidth,width:innerWidth,desktop:!!document.querySelector(".desktop")})');
  check("DESKTOP_1440",desktop.scroll<=desktop.width&&desktop.desktop,"scroll="+desktop.scroll+" width="+desktop.width);

  check("CONSOLE_ERRORS",errors.length===0,errors.join(" | "));
} finally {
  try{cdp?.close();}catch{}
  try{if(tab?.id)await fetch("http://"+HOST+":"+CDP_PORT+"/json/close/"+tab.id);}catch{}
  chrome.kill();
  await new Promise(resolve=>server.close(resolve));
  await sleep(200);
  try{fs.rmSync(userData,{recursive:true,force:true,maxRetries:4,retryDelay:150});}catch{}
}

const required=[
  "PUBLIC_BROWSE_NO_PROFILE","PROFILE_CREATE","PROFILE_LOCAL_ONLY","FAVORITE","SAVE_SEARCH",
  "APPLICATION_TRACKING","COACH_DISCONNECTED_STATE","MOBILE_390","DESKTOP_1440","CONSOLE_ERRORS"
];
if(required.some(x=>results.get(x)!==true))process.exitCode=1;
