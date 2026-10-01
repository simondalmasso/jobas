import { resolveApplicationMode } from "../public/workflow.js";

const PROTOCOL_VERSION="2025-06-18";
const SERVER_INFO={name:"JOBAS Public MCP",version:"1.0.0"};
const JSON_HEADERS={
  "content-type":"application/json; charset=utf-8",
  "cache-control":"no-store",
  "access-control-allow-origin":"*",
  "access-control-allow-methods":"POST, OPTIONS",
  "access-control-allow-headers":"content-type, accept, mcp-protocol-version"
};

const SKILLS=[
  {
    id:"superpowers",
    name:"Superpowers",
    description:"Process discipline for coding, debugging, planning and verification.",
    url:"https://raw.githubusercontent.com/obra/superpowers/main/skills/using-superpowers/SKILL.md",
    tags:["code","debug","test","plan","implementation","review","workflow"],
    mode:"hosted-skill"
  },
  {
    id:"incremental-implementation",
    name:"Incremental Implementation",
    description:"Small verified changes with bounded scope and checkpoints.",
    url:"https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/incremental-implementation/SKILL.md",
    tags:["code","implement","incremental","change","refactor","test"],
    mode:"hosted-skill"
  },
  {
    id:"context-engineering",
    name:"Context Engineering",
    description:"Keep agent context focused, compact and task-relevant.",
    url:"https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/context-engineering/SKILL.md",
    tags:["context","agent","prompt","handoff","memory","research"],
    mode:"hosted-skill"
  },
  {
    id:"security-audit",
    name:"Cloudflare Security Audit",
    description:"Structured application security review skill.",
    url:"https://raw.githubusercontent.com/cloudflare/security-audit-skill/main/skills/security-audit/SKILL.md",
    tags:["security","audit","vulnerability","code","cloudflare"],
    mode:"hosted-skill"
  }
];

const ZERO_COST_CATALOG=[
  {id:"superpowers",name:"obra/superpowers",url:"https://github.com/obra/superpowers",mode:"hosted-skill",reason:"Text skill only; tiny runtime cost; fetched only when an agent asks for it."},
  {id:"addy-agent-skills",name:"addyosmani/agent-skills",url:"https://github.com/addyosmani/agent-skills",mode:"hosted-skill",reason:"Production-oriented skill files; no local install required."},
  {id:"cloudflare-security-audit",name:"cloudflare/security-audit-skill",url:"https://github.com/cloudflare/security-audit-skill",mode:"hosted-skill",reason:"Small, focused audit skill; fetched on demand."},
  {id:"public-apis",name:"public-apis/public-apis",url:"https://github.com/public-apis/public-apis",mode:"public-catalog",reason:"Free API catalog readable on demand through GitHub."},
  {id:"awesome-free-llm-apis",name:"mnfst/awesome-free-llm-apis",url:"https://github.com/mnfst/awesome-free-llm-apis",mode:"public-catalog",reason:"Reference catalog only; no provider keys embedded in JOBAS."},
  {id:"crawl4ai",name:"unclecode/crawl4ai",url:"https://github.com/unclecode/crawl4ai",mode:"external-heavy",reason:"Python/browser crawler; useful externally but too heavy for a minimal Cloudflare Worker."},
  {id:"scrapling",name:"D4Vinci/Scrapling",url:"https://github.com/D4Vinci/Scrapling",mode:"external-heavy",reason:"Python scraping/browser stack; not embedded in the Worker."},
  {id:"firecrawl",name:"firecrawl/firecrawl",url:"https://github.com/firecrawl/firecrawl",mode:"external-heavy",reason:"Self-hosted crawling service with substantial runtime footprint."},
  {id:"browser-use",name:"browser-use/browser-use",url:"https://github.com/browser-use/browser-use",mode:"external-heavy",reason:"Browser automation runtime; unsuitable for a lightweight edge MCP."},
  {id:"stagehand",name:"browserbase/stagehand",url:"https://github.com/browserbase/stagehand",mode:"external-heavy",reason:"Browser automation; best used as an external client capability."},
  {id:"playwright",name:"microsoft/playwright",url:"https://github.com/microsoft/playwright",mode:"external-heavy",reason:"Browser binaries are not appropriate inside this Worker."},
  {id:"laya-cpp",name:"lkarlslund/laya.cpp",url:"https://github.com/lkarlslund/laya.cpp",mode:"external-runtime",reason:"Native local inference/runtime; not a Worker dependency."},
  {id:"laya-mlx",name:"mizorewww/laya-mlx",url:"https://github.com/mizorewww/laya-mlx",mode:"external-runtime",reason:"MLX targets Apple hardware; irrelevant to Cloudflare Worker runtime."},
  {id:"laya-coreml",name:"mizorewww/laya-coreml",url:"https://github.com/mizorewww/laya-coreml",mode:"external-runtime",reason:"CoreML targets Apple devices; not a Worker runtime."},
  {id:"lev",name:"interfaze-ai/lev",url:"https://huggingface.co/interfaze-ai/lev",mode:"external-runtime",reason:"Model/runtime asset; would require inference infrastructure."},
  {id:"exa",name:"Exa",url:"https://exa.ai",mode:"external-provider",reason:"Good research provider, but public server-side use requires provider access/credentials; not embedded."},
  {id:"parallel-search",name:"Parallel Search",url:"https://parallel.ai",mode:"external-provider",reason:"Useful client-side search capability; not embedded without provider access."},
  {id:"wolfram",name:"Wolfram",url:"https://www.wolfram.com",mode:"external-provider",reason:"Provider API requires its own access; JOBAS exposes no shared secret."},
  {id:"github-client",name:"GitHub",url:"https://github.com",mode:"native-public-read",reason:"JOBAS exposes bounded public GitHub README/file reads without credentials."}
];

const TOOL_DEFS=[
  {
    name:"agent_bootstrap",
    description:"One-call JOBAS entry point for an agent: current counts, top opportunities, microjobs, MCP capabilities and suggested next calls. Read-only.",
    inputSchema:{type:"object",properties:{limit:{type:"integer",minimum:1,maximum:20}},additionalProperties:false}
  },
  {
    name:"jobas_status",
    description:"Read current JOBAS feed status and public opportunity counts. Read-only.",
    inputSchema:{type:"object",properties:{},additionalProperties:false}
  },
  {
    name:"list_jobs",
    description:"List public JOBAS opportunities with optional lane/category/application filters. Read-only.",
    inputSchema:{type:"object",properties:{
      lane:{type:"string",enum:["REMOTO","LOCAL"]},
      category:{type:"string",minLength:1},
      application_mode:{type:"string",enum:["cv","direct","platform"]},
      argentina_only:{type:"boolean"},
      known_pay:{type:"boolean"},
      limit:{type:"integer",minimum:1,maximum:100},
      offset:{type:"integer",minimum:0,maximum:10000}
    },additionalProperties:false}
  },
  {
    name:"search_jobs",
    description:"Search public JOBAS opportunities by free text across title, company, description, source and tags. Read-only.",
    inputSchema:{type:"object",properties:{
      query:{type:"string",minLength:1},
      lane:{type:"string",enum:["REMOTO","LOCAL"]},
      category:{type:"string",minLength:1},
      application_mode:{type:"string",enum:["cv","direct","platform"]},
      argentina_only:{type:"boolean"},
      known_pay:{type:"boolean"},
      limit:{type:"integer",minimum:1,maximum:100}
    },required:["query"],additionalProperties:false}
  },
  {
    name:"inspect_job",
    description:"Inspect one public JOBAS opportunity by job id. Read-only.",
    inputSchema:{type:"object",properties:{job_id:{type:"string",minLength:1}},required:["job_id"],additionalProperties:false}
  },
  {
    name:"rank_jobs",
    description:"Return the highest-priority JOBAS opportunities after optional public filters. Read-only.",
    inputSchema:{type:"object",properties:{
      lane:{type:"string",enum:["REMOTO","LOCAL"]},
      category:{type:"string",minLength:1},
      application_mode:{type:"string",enum:["cv","direct","platform"]},
      argentina_only:{type:"boolean"},
      known_pay:{type:"boolean"},
      limit:{type:"integer",minimum:1,maximum:100}
    },additionalProperties:false}
  },
  {
    name:"list_microjobs",
    description:"List JOBAS microjobs, direct-contact opportunities and marketplace proposals that do not use the traditional CV flow. Read-only.",
    inputSchema:{type:"object",properties:{
      lane:{type:"string",enum:["REMOTO","LOCAL"]},
      category:{type:"string",minLength:1},
      argentina_only:{type:"boolean"},
      known_pay:{type:"boolean"},
      limit:{type:"integer",minimum:1,maximum:100}
    },additionalProperties:false}
  },
  {
    name:"list_sources",
    description:"Read JOBAS public source registry, health and GPT radar source state. Read-only.",
    inputSchema:{type:"object",properties:{},additionalProperties:false}
  },
  {
    name:"research_zero_cost_catalog",
    description:"List JOBAS-vetted free/light agent resources and classify which ones are hosted skills, public catalogs, external runtimes or heavy tools. Read-only.",
    inputSchema:{type:"object",properties:{mode:{type:"string",minLength:1}},additionalProperties:false}
  },
  {
    name:"research_github_readme",
    description:"Read a public GitHub repository README without credentials. Read-only.",
    inputSchema:{type:"object",properties:{
      repo:{type:"string",minLength:3},
      ref:{type:"string",minLength:1},
      max_chars:{type:"integer",minimum:1000,maximum:50000}
    },required:["repo"],additionalProperties:false}
  },
  {
    name:"research_github_file",
    description:"Read one text file from a public GitHub repository through raw.githubusercontent.com. Read-only.",
    inputSchema:{type:"object",properties:{
      repo:{type:"string",minLength:3},
      path:{type:"string",minLength:1},
      ref:{type:"string",minLength:1},
      max_chars:{type:"integer",minimum:1000,maximum:50000}
    },required:["repo","path"],additionalProperties:false}
  },
  {
    name:"skill_list",
    description:"List install-free skills hosted by JOBAS from vetted public repositories. Read-only.",
    inputSchema:{type:"object",properties:{tag:{type:"string",minLength:1}},additionalProperties:false}
  },
  {
    name:"skill_route",
    description:"Route a task to the most relevant JOBAS-hosted skills. Read-only.",
    inputSchema:{type:"object",properties:{
      task:{type:"string",minLength:2},
      limit:{type:"integer",minimum:1,maximum:5}
    },required:["task"],additionalProperties:false}
  },
  {
    name:"skill_get",
    description:"Fetch one vetted skill into the current agent context. The skill is read from its public source only when requested. Read-only.",
    inputSchema:{type:"object",properties:{
      id:{type:"string",minLength:1},
      max_chars:{type:"integer",minimum:1000,maximum:50000}
    },required:["id"],additionalProperties:false}
  },
  {
    name:"mcp_status",
    description:"Read JOBAS public MCP protocol, cost posture and safety status. Read-only.",
    inputSchema:{type:"object",properties:{},additionalProperties:false}
  }
];

function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:JSON_HEADERS});}
function rpc(id,result){return json({jsonrpc:"2.0",id,result});}
function rpcError(id,code,message,data){
  const error={code,message}; if(data!==undefined)error.data=data;
  return json({jsonrpc:"2.0",id:id??null,error});
}
function notificationAccepted(){return new Response(null,{status:202,headers:JSON_HEADERS});}
function intArg(value,fallback,min,max){
  if(value===undefined||value===null)return fallback;
  const n=Number(value); if(!Number.isInteger(n)||n<min||n>max)throw new Error("INVALID_PARAMS");
  return n;
}
function requireString(value){
  if(typeof value!=="string"||!value.trim())throw new Error("INVALID_PARAMS");
  return value.trim();
}
function knownPay(job){return job?.pay?.monthlyMin!=null||job?.pay?.monthlyMax!=null;}
function applicationMode(job){return job?.applicationMode||resolveApplicationMode(job);}
function presentJob(job){return {...job,applicationMode:applicationMode(job)};}
function filterJobs(feed,args={}){
  let jobs=Array.isArray(feed?.jobs)?feed.jobs:[];
  if(args.lane)jobs=jobs.filter(j=>String(j.lane||"").toUpperCase()===args.lane);
  if(args.category)jobs=jobs.filter(j=>j.category===args.category);
  if(args.application_mode)jobs=jobs.filter(j=>applicationMode(j)===args.application_mode);
  if(args.argentina_only===true)jobs=jobs.filter(j=>Number(j?.argentina?.score||0)>=80);
  if(args.known_pay===true)jobs=jobs.filter(knownPay);
  return jobs;
}
function paginate(jobs,args={}){
  const limit=intArg(args.limit,20,1,100),offset=intArg(args.offset,0,0,10000);
  return{count:Math.max(0,Math.min(limit,jobs.length-offset)),total:jobs.length,offset,limit,jobs:jobs.slice(offset,offset+limit).map(presentJob)};
}
function result(data){return{content:[{type:"text",text:JSON.stringify(data)}],structuredContent:data,isError:false};}
function counts(feed){
  const jobs=Array.isArray(feed?.jobs)?feed.jobs:[];
  return{
    total:jobs.length,
    remote:jobs.filter(j=>String(j.lane||"").toUpperCase()==="REMOTO").length,
    local:jobs.filter(j=>String(j.lane||"").toUpperCase()==="LOCAL").length,
    microjobs:jobs.filter(j=>applicationMode(j)!=="cv").length
  };
}
function safeRepo(repo){
  const v=requireString(repo);
  if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(v))throw new Error("INVALID_PARAMS");
  return v;
}
function safeRef(ref){
  const v=ref?requireString(ref):"main";
  if(!/^[A-Za-z0-9._\/-]+$/.test(v)||v.includes(".."))throw new Error("INVALID_PARAMS");
  return v;
}
function safePath(path){
  const v=requireString(path).replace(/^\/+/, "");
  if(v.includes("..")||!^[A-Za-z0-9._\/-]+$/.test(v))throw new Error("INVALID_PARAMS");
  return v;
}
async function fetchText(context,url,maxChars=20000){
  const text=await context.fetchText(url);
  return String(text||"").slice(0,maxChars);
}
function scoreSkill(skill,task){
  const q=task.toLowerCase();
  let score=0;
  for(const tag of skill.tags)if(q.includes(tag))score+=4;
  const words=q.split(/[^a-z0-9]+/).filter(Boolean);
  for(const word of words)if(skill.description.toLowerCase().includes(word)||skill.name.toLowerCase().includes(word))score++;
  if(skill.id==="superpowers"&&/(debug|test|code|implement|plan|fix|review)/.test(q))score+=8;
  return score;
}

async function callTool(name,args,context){
  if(name==="mcp_status")return{
    service:"JOBAS",server:SERVER_INFO,protocolVersion:PROTOCOL_VERSION,endpoint:"/mcp",
    public:true,auth:false,readOnly:true,scheduledMcpCalls:false,workerCronAddedByMcp:false,
    costPosture:"on-demand only; no MCP polling loop or hourly Cloudflare trigger",
    tools:TOOL_DEFS.map(x=>x.name)
  };
  if(name==="research_zero_cost_catalog"){
    const items=args.mode?ZERO_COST_CATALOG.filter(x=>x.mode===args.mode):ZERO_COST_CATALOG;
    return{count:items.length,items};
  }
  if(name==="skill_list"){
    const tag=args.tag?String(args.tag).toLowerCase():null;
    const skills=tag?SKILLS.filter(x=>x.tags.includes(tag)):SKILLS;
    return{count:skills.length,skills:skills.map(({url,...x})=>({...x,source:url}))};
  }
  if(name==="skill_route"){
    const task=requireString(args.task),limit=intArg(args.limit,3,1,5);
    const skills=SKILLS.map(s=>({...s,score:scoreSkill(s,task)})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,limit);
    return{task,skills:skills.map(({url,...x})=>({...x,source:url}))};
  }
  if(name==="skill_get"){
    const id=requireString(args.id),skill=SKILLS.find(x=>x.id===id);
    if(!skill)throw new Error("INVALID_PARAMS");
    const maxChars=intArg(args.max_chars,30000,1000,50000);
    const content=await fetchText(context,skill.url,maxChars);
    return{id:skill.id,name:skill.name,source:skill.url,content};
  }
  if(name==="research_github_readme"){
    const repo=safeRepo(args.repo),ref=safeRef(args.ref),maxChars=intArg(args.max_chars,20000,1000,50000);
    const refs=args.ref?[ref]:[ref==="main"?"main":"main","master"];
    let lastError=null;
    for(const candidate of [...new Set(refs)]){
      try{
        const url=`https://raw.githubusercontent.com/${repo}/${candidate}/README.md`;
        const content=await fetchText(context,url,maxChars);
        return{repo,ref:candidate,path:"README.md",source:url,content};
      }catch(error){lastError=error;}
    }
    throw lastError||new Error("NOT_FOUND");
  }
  if(name==="research_github_file"){
    const repo=safeRepo(args.repo),ref=safeRef(args.ref),path=safePath(args.path),maxChars=intArg(args.max_chars,20000,1000,50000);
    const url=`https://raw.githubusercontent.com/${repo}/${ref}/${path}`;
    const content=await fetchText(context,url,maxChars);
    return{repo,ref,path,source:url,content};
  }
  if(name==="list_sources")return context.getSources();

  const feed=await context.getFeed();
  if(name==="jobas_status")return{
    service:"JOBAS",version:feed?.version||null,generatedAt:feed?.generatedAt||null,
    jobs:counts(feed),gptFindingsCount:feed?.gptFindingsCount??null,public:true,auth:false
  };
  if(name==="agent_bootstrap"){
    const limit=intArg(args.limit,8,1,20),ranked=filterJobs(feed,{argentina_only:true}).slice().sort((a,b)=>(Number(b.priority)||0)-(Number(a.priority)||0));
    const micro=filterJobs(feed,{}).filter(j=>applicationMode(j)!=="cv").slice().sort((a,b)=>(Number(b.priority)||0)-(Number(a.priority)||0));
    return{
      service:"JOBAS",endpoint:"/mcp",public:true,auth:false,readOnly:true,
      generatedAt:feed?.generatedAt||null,counts:counts(feed),
      top:ranked.slice(0,limit).map(presentJob),microjobs:micro.slice(0,limit).map(presentJob),
      next:["search_jobs","inspect_job","list_microjobs","skill_route","skill_get"],
      note:"Stateless/on-demand MCP. No MCP hourly polling or background loop."
    };
  }
  if(name==="list_jobs")return paginate(filterJobs(feed,args),args);
  if(name==="search_jobs"){
    const query=requireString(args.query).toLowerCase();
    const jobs=filterJobs(feed,args).filter(j=>[
      j.title,j.company,j.description,j.sourceName,j.location,j.category,...(Array.isArray(j.tags)?j.tags:[])
    ].filter(Boolean).join(" ").toLowerCase().includes(query));
    return paginate(jobs,{...args,offset:0});
  }
  if(name==="inspect_job"){
    const jobId=requireString(args.job_id),job=(feed?.jobs||[]).find(j=>String(j.id||"")===jobId);
    return{found:Boolean(job),job:job?presentJob(job):null};
  }
  if(name==="rank_jobs"){
    const jobs=filterJobs(feed,args).slice().sort((a,b)=>(Number(b.priority)||0)-(Number(a.priority)||0));
    return paginate(jobs,{...args,offset:0});
  }
  if(name==="list_microjobs"){
    const jobs=filterJobs(feed,args).filter(j=>applicationMode(j)!=="cv");
    return paginate(jobs,{...args,offset:0});
  }
  throw new Error("UNKNOWN_TOOL");
}

export async function handleMcpRequest(request,context){
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:JSON_HEADERS});
  if(request.method!=="POST")return json({error:"METHOD_NOT_ALLOWED"},405);
  let message;
  try{message=await request.json();}catch{return rpcError(null,-32700,"PARSE_ERROR");}
  if(!message||message.jsonrpc!=="2.0"||typeof message.method!=="string")return rpcError(message?.id??null,-32600,"INVALID_REQUEST");
  const id=message.id??null,params=message.params||{};
  if(message.method.startsWith("notifications/"))return notificationAccepted();
  if(message.method==="ping")return rpc(id,{});
  if(message.method==="initialize")return rpc(id,{
    protocolVersion:PROTOCOL_VERSION,
    capabilities:{tools:{listChanged:false}},
    serverInfo:SERVER_INFO,
    instructions:"Public read-only JOBAS MCP. Start with agent_bootstrap. Jobs, microjobs, public GitHub reads and install-free skills are on-demand. No login, messaging, application submission, browser automation, model hosting or shared provider secrets are exposed."
  });
  if(message.method==="tools/list")return rpc(id,{tools:TOOL_DEFS});
  if(message.method==="tools/call"){
    const name=params?.name,args=params?.arguments||{};
    if(typeof name!=="string"||!args||typeof args!=="object"||Array.isArray(args))return rpcError(id,-32602,"INVALID_PARAMS");
    try{return rpc(id,result(await callTool(name,args,context)));}
    catch(error){
      const msg=String(error?.message||error);
      if(msg==="INVALID_PARAMS"||msg==="UNKNOWN_TOOL")return rpcError(id,-32602,msg);
      return rpcError(id,-32603,"INTERNAL_ERROR");
    }
  }
  return rpcError(id,-32601,"METHOD_NOT_FOUND");
}

export { TOOL_DEFS, PROTOCOL_VERSION, SKILLS, ZERO_COST_CATALOG };
