import { applicationHref, applicationWorkflow, safeExternalHref, sameJob } from "./workflow.js";

const $=s=>document.querySelector(s);

const state={
  jobs:[],
  feed:null,
  category:"",
  knownPay:false,
  argOnly:true,
  mode:"remote"
};

const PROGRESS_KEY="jobas:in-progress:v1";
const HERFASA_SEED={id:"manual-herfasa",lane:"LOCAL",curated:true,title:"ABERTURA HERFASA",company:"ABERTURA HERFASA",location:"Santa Fe",description:"Postulación en curso.",url:"",sourceName:"Seguimiento manual",sourceUrl:"",sourceDetail:"",category:"other",pay:{raw:"No publicado",monthlyMin:null,monthlyMax:null,currency:"ARS"},priority:100,argentina:{score:100,label:"Local"},scam:{score:100,label:"Seguimiento"},workerFee:false};
const JOBAS_PROJECT_URL="https://chatgpt.com/g/g-p-6a8c77fe091081918b6fe7a55ee58c30-jobas/project";
const CV_BASE_FOLDER="https://drive.google.com/drive/folders/1kBzaRZkGI0YK38SF4s2eTe_1eHaSAsn8?hl=es-419";
const DIRECT_LINK_OVERRIDES={
  "telegram · drop shipping group":"https://web.telegram.org/a/#-1001374899921"
};

const labels={
  "customer-success":"Customer Success",
  "support":"Soporte / CX",
  "travel":"Travel / Reservas",
  "admin-va":"Asistencia / Admin",
  "operations":"Operaciones",
  "sales":"Ventas / SDR",
  "marketing":"Marketing / Growth",
  "ecommerce-crm":"E-commerce / CRM",
  "content-social":"Contenido / Social",
  "data-ai":"Data / AI",
  "tech":"Tech",
  "finance":"Finanzas",
  "other":"Otros"
};

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

function enrichProgressJob(job){
  if(job?.directUrl)return job;
  const directUrl=DIRECT_LINK_OVERRIDES[String(job?.sourceName||"").trim().toLowerCase()];
  return directUrl?{...job,directUrl}:job;
}

function getProgressJobs(){
  try{
    const value=JSON.parse(localStorage.getItem(PROGRESS_KEY)||"[]");
    const jobs=(Array.isArray(value)?value:[]).map(enrichProgressJob);
    if(!jobs.some(x=>x.id===HERFASA_SEED.id||String(x.company||"").toUpperCase()==="ABERTURA HERFASA")){
      jobs.unshift(HERFASA_SEED);
      localStorage.setItem(PROGRESS_KEY,JSON.stringify(jobs));
    }
    return jobs;
  }catch{
    localStorage.setItem(PROGRESS_KEY,JSON.stringify([HERFASA_SEED]));
    return[HERFASA_SEED];
  }
}
function setProgressJobs(jobs){
  localStorage.setItem(PROGRESS_KEY,JSON.stringify(jobs));
  updateProgressCount();
}

function progressHas(job){
  return getProgressJobs().some(x=>sameJob(x,job));
}

function toggleProgress(job){
  const jobs=getProgressJobs();
  const i=jobs.findIndex(x=>sameJob(x,job));
  if(i>=0)jobs.splice(i,1);
  else jobs.unshift(job);
  setProgressJobs(jobs);
  renderCategories();
  render();
}

function updateProgressCount(){
  const el=$("#progressCount");
  if(el)el.textContent=getProgressJobs().length;
}

function updateProspectCount(){
  const el=$("#prospectCount");
  if(el)el.textContent=state.jobs.filter(isProspect).length;
}

function isProspect(job){
  return job?.prospectType==="microjob"||job?.lane==="PROSPECTOS"||job?.source==="gpt-prospectos";
}

function isLocalJob(job){
  if(job.lane==="LOCAL")return true;
  if(job.lane==="REMOTO")return false;
  const text=(String(job.location||"")+" "+String(job.description||"")).toLowerCase();
  const local=/santa fe|santo tom[eé]|paran[aá]|presencial|h[ií]brido/.test(text);
  const broadRemote=/worldwide|anywhere|latam|latin america/.test(text);
  return local&&!broadRemote;
}

function monthly(job){
  const p=job.pay||{};
  if(!p.monthlyMin&&!p.monthlyMax)return"Pago no publicado";
  const f=n=>new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(n);
  const cur=p.currency||"USD";
  let text=p.monthlyMin&&p.monthlyMax&&p.monthlyMin!==p.monthlyMax
    ?`${cur} ${f(p.monthlyMin)}–${f(p.monthlyMax)} / mes`
    :`${cur} ${f(p.monthlyMin||p.monthlyMax)} / mes`;
  if(p.estimateBasis)text=`≈ ${text}`;
  return text;
}

function baseForMode(){
  if(state.mode==="progress")return getProgressJobs();
  if(state.mode==="prospects")return state.jobs.filter(isProspect);
  if(state.mode==="local")return state.jobs.filter(j=>!isProspect(j)&&isLocalJob(j));
  return state.jobs.filter(j=>!isProspect(j)&&!isLocalJob(j));
}

function filtered(){
  const q=$("#q").value.trim().toLowerCase();
  const argentinaFilterApplies=state.mode==="remote"||state.mode==="local";
  return baseForMode().filter(j=>
    (!q||`${j.title} ${j.company} ${j.buyer||""} ${j.description||""}`.toLowerCase().includes(q)) &&
    (!state.category||j.category===state.category) &&
    (!state.knownPay||(j.pay?.monthlyMin||j.pay?.monthlyMax)) &&
    (!state.argOnly||!argentinaFilterApplies||j.argentina?.score>=80)
  );
}

function makeCvPrompt(j){
  return [
    'Hacé una copia del archivo "CV SIMÓN DALMASSO /// ARCHIVO BASE" que está en:',
    CV_BASE_FOLDER,
    '',
    'Adaptalo específicamente a esta postulación:',
    j.url,
    '',
    'Puesto visible en JOBAS: '+j.title,
    'Empresa visible en JOBAS: '+j.company,
    '',
    'ANTES DE EDITAR EL CV:',
    '1. Abrí e investigá la postulación original y verificá que siga activa.',
    '2. Desglosá exactamente qué exige el puesto: responsabilidades, requisitos, seniority, herramientas, idioma, ubicación, modalidad, keywords y señales ATS.',
    '3. Investigá forense/quirúrgicamente a la empresa: web oficial, producto/servicio, estructura, historia, cultura, equipo, RR.HH./recruiting, presencia pública, reputación y cualquier dato relevante y verificable.',
    '4. Separá hechos confirmados de inferencias. No uses como hecho nada que no puedas verificar.',
    '5. Recién después compará todo contra mi historial real del CV base y decidí qué enfatizar, reordenar, resumir o reformular.',
    '',
    'ADAPTACIÓN DEL CV:',
    '- Máximo 2 páginas — NON_NEGOTIABLE.',
    '- No inventes experiencia, cargos, fechas, estudios, herramientas, métricas ni logros.',
    '- No agregues nada que no exista en mi historial laboral real.',
    '- No llenes de humo, no me sobrecapacites y no te pases de técnico.',
    '- Sí podés reformular, priorizar, condensar y reordenar mi experiencia real para maximizar ajuste funcional a POSTULACIÓN / PUESTO / EMPRESA / KEYWORDS.',
    '- Conservá un tono profesional, concreto, humano y ATS-friendly.',
    '- Incluí mi foto "1x1" que está en la misma carpeta de Drive.',
    '- Si un requisito no está respaldado por mi historial, no lo presentes como experiencia mía.',
    '',
    'ENTREGA:',
    '- Creá la copia adaptada sin modificar el archivo base.',
    '- Renombrala exactamente: "CV SIMON DALMASSO '+j.company+'".',
    '- Guardala en Google Drive.',
    '- Cuando termines, servime EN ESTE CHAT el link directo de Drive al CV final para revisarlo.',
    '- Informame brevemente qué cambiaste y por qué, y señalá cualquier requisito importante del puesto que mi historial real no cubra.',
    '',
    'No empieces a adaptar hasta haber completado la investigación de la vacante y la empresa.'
  ].join('\n');
}

function copyText(text){
  if(navigator.clipboard?.writeText){
    navigator.clipboard.writeText(text).catch(()=>{});
    return;
  }
  const t=document.createElement("textarea");
  t.value=text;
  t.style.position="fixed";
  t.style.opacity="0";
  document.body.appendChild(t);
  t.select();
  try{document.execCommand("copy")}catch{}
  t.remove();
}

function launchCvAdapt(job){
  const prompt=makeCvPrompt(job);
  copyText(prompt);
  window.open(`${JOBAS_PROJECT_URL}?q=${encodeURIComponent(prompt)}`,"_blank","noopener,noreferrer");
}

function renderJobActions(job){
  const inProgress=progressHas(job);
  const flow=applicationWorkflow(job,inProgress);
  const progressButton=`<button class="progress-action${inProgress?" active":""}" type="button" data-action="progress">${esc(flow.progressLabel)}</button>`;
  if(!job.url)return progressButton+`<span class="manual-status">SEGUIMIENTO</span>`;
  const href=safeExternalHref(applicationHref(job,inProgress));
  if(flow.requiresCv){
    return progressButton+`<button class="adapt" type="button" data-action="adapt">ADAPTAR CV</button><a class="apply" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(flow.linkLabel)}</a>`;
  }
  return progressButton+`<a class="apply" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(flow.linkLabel)}</a>`;
}

function render(){
  const jobs=filtered();
  const label=state.mode==="remote"?"remotas":state.mode==="local"?"locales":state.mode==="prospects"?"prospectos microjobs":"en curso";
  const note=state.mode==="progress"?"guardadas en este navegador":state.mode==="prospects"?"demanda directa verificada · link directo":"orden: Argentina + fuente + pago + frescura";
  $("#summary").innerHTML=`<span class="pill">${jobs.length} ${label}</span><span class="pill">${note}</span>`;
  $("#feed").innerHTML=jobs.length?jobs.map(j=>`
    <article class="job" data-job-id="${esc(j.id||j.url)}">
      <div>
        <div class="title">${esc(j.title)}</div>
        <div class="company">${esc(j.company)}</div>
        <div class="meta">
          <span class="tag">${esc(labels[j.category]||j.category)}</span>
          <span class="tag good">${esc(j.argentina?.label||"A verificar")}</span>
          <span class="tag">${esc(j.location||"Remote")}</span>
          <span class="tag pay">${esc(monthly(j))}</span>
        </div>
        <div class="why">
          <span class="priority">Prioridad ${j.priority}/100</span>
          <span>·</span>
          <span>${esc(j.scam?.label||"")}</span>
          <span>·</span>
          <span>${j.workerFee===false?"Sin cargo para postular":"Condiciones a verificar"}</span>
        </div>
        <div class="source-row">Fuente: ${safeExternalHref(j.sourceDetail||j.sourceUrl)?`<a href="${esc(safeExternalHref(j.sourceDetail||j.sourceUrl))}" target="_blank" rel="noopener noreferrer">${esc(j.sourceName)}</a>`:esc(j.sourceName||"Manual")} · ${j.publishedAt?new Date(j.publishedAt).toLocaleDateString("es-AR"):"seguimiento manual"}</div>
      </div>
      <div class="actions">${renderJobActions(j)}</div>
    </article>
  `).join(""):`<div class="empty">${state.mode==="local"?"Todavía no hay ofertas locales cargadas.":state.mode==="progress"?"No marcaste ninguna oportunidad como en curso.":state.mode==="prospects"?"Todavía no hay prospectos microjobs verificados.":"No hay resultados con estos filtros."}</div>`;
}

function renderCategories(){
  const source=baseForMode();
  const counts={};
  source.forEach(j=>counts[j.category]=(counts[j.category]||0)+1);
  const cats=[
    {id:"",count:source.length,label:"Todos"},
    ...Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([id,count])=>({id,count,label:labels[id]||id}))
  ];
  $("#categories").innerHTML=cats.map(x=>`<button class="cat${x.id===state.category?" active":""}" data-cat="${esc(x.id)}">${esc(x.label)} · ${x.count}</button>`).join("");
}

async function boot(){
  const r=await fetch("/api/feed",{cache:"no-store"});
  const feed=await r.json();
  state.feed=feed;
  state.jobs=feed.jobs||[];
  $("#fresh").textContent=feed.generatedAt?`actualizado ${new Date(feed.generatedAt).toLocaleString("es-AR")}`:"sin actualización";
  updateProgressCount();
  updateProspectCount();
  renderCategories();
  $("#sourceHealth").innerHTML='<div class="source-grid">'+(feed.health||[]).map(s=>safeExternalHref(s.url)?`<a class="source-card" href="${esc(safeExternalHref(s.url))}" target="_blank" rel="noopener noreferrer"><strong>${esc(s.name)}</strong><br>${esc(s.state)} · ${s.jobs} jobs</a>`:`<div class="source-card"><strong>${esc(s.name)}</strong><br>${esc(s.state)} · ${s.jobs} jobs</div>`).join("")+'</div>';
  $("#discovery").innerHTML='<div class="source-grid">'+(feed.discoverySources||[]).map(s=>safeExternalHref(s.url)?`<a class="source-card" href="${esc(safeExternalHref(s.url))}" target="_blank" rel="noopener noreferrer"><strong>${esc(s.name)}</strong><br>${esc(s.note)}</a>`:`<div class="source-card"><strong>${esc(s.name)}</strong><br>${esc(s.note)}</div>`).join("")+'</div>';
  render();
}

function selectMode(mode){
  if(!["remote","local","progress","prospects"].includes(mode))return;
  state.mode=mode;
  state.category="";
  document.querySelectorAll(".feed-mode").forEach(x=>x.classList.toggle("active",x.dataset.mode===state.mode));
  renderCategories();
  render();
}

function syncFilterButtons(){
  $("#knownPay").setAttribute("aria-pressed",String(state.knownPay));
  $("#argOnly").setAttribute("aria-pressed",String(state.argOnly));
}

function closeMenus(){
  document.querySelectorAll("[data-menu]").forEach(x=>x.hidden=true);
  document.querySelectorAll("[data-menu-trigger]").forEach(x=>x.setAttribute("aria-expanded","false"));
}

function toggleMenu(name){
  const panel=document.querySelector(`[data-menu="${name}"]`);
  const trigger=document.querySelector(`[data-menu-trigger="${name}"]`);
  if(!panel||!trigger)return;
  const opening=panel.hidden;
  closeMenus();
  panel.hidden=!opening;
  trigger.setAttribute("aria-expanded",String(opening));
}

let toastTimer;
function showToast(message){
  const el=$("#toast");
  if(!el)return;
  clearTimeout(toastTimer);
  el.textContent=message;
  el.hidden=false;
  toastTimer=setTimeout(()=>{el.hidden=true;},2600);
}

function runCommand(command){
  if(command==="toggle-pay"){state.knownPay=!state.knownPay;syncFilterButtons();render();}
  if(command==="toggle-arg"){state.argOnly=!state.argOnly;syncFilterButtons();render();}
  if(command==="clear-filters"){
    state.category="";
    state.knownPay=false;
    state.argOnly=true;
    $("#q").value="";
    syncFilterButtons();
    renderCategories();
    render();
  }
  if(command==="toggle-tree")document.body.classList.toggle("tree-collapsed");
  if(command==="toggle-sources"){$(".sources").open=!$(".sources").open;}
  if(command==="focus-search")$("#q").focus();
  if(command==="show-shortcuts")showToast("/ buscar · 1-4 vistas · T panel · S fuentes · Esc cerrar menú");
}

$(".menubar").addEventListener("click",e=>{
  const trigger=e.target.closest("[data-menu-trigger]");
  if(trigger){toggleMenu(trigger.dataset.menuTrigger);return;}
  const mode=e.target.closest("[data-mode-command]");
  if(mode){selectMode(mode.dataset.modeCommand);closeMenus();return;}
  const command=e.target.closest("[data-command]");
  if(command){runCommand(command.dataset.command);closeMenus();}
});

document.addEventListener("click",e=>{
  if(!e.target.closest(".menu-group"))closeMenus();
});

document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){closeMenus();return;}
  const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||"");
  if(typing)return;
  if(e.key==="/"){e.preventDefault();$("#q").focus();return;}
  if(e.key==="1")selectMode("remote");
  if(e.key==="2")selectMode("local");
  if(e.key==="3")selectMode("progress");
  if(e.key==="4")selectMode("prospects");
  if(e.key.toLowerCase()==="t")runCommand("toggle-tree");
  if(e.key.toLowerCase()==="s")runCommand("toggle-sources");
});

$("#feedModes").addEventListener("click",e=>{
  const b=e.target.closest("[data-mode]");
  if(!b)return;
  selectMode(b.dataset.mode);
});

$("#categories").addEventListener("click",e=>{
  const b=e.target.closest("[data-cat]");
  if(!b)return;
  state.category=b.dataset.cat;
  renderCategories();
  render();
});

$("#feed").addEventListener("click",e=>{
  const card=e.target.closest(".job");
  if(!card)return;
  const source=state.mode==="progress"?getProgressJobs():state.jobs;
  const job=source.find(j=>(j.id||j.url)===card.dataset.jobId);
  if(!job)return;
  if(e.target.closest('[data-action="progress"]'))toggleProgress(job);
  if(e.target.closest('[data-action="adapt"]'))launchCvAdapt(job);
});

$("#q").addEventListener("input",render);
$("#knownPay").onclick=()=>runCommand("toggle-pay");
$("#argOnly").onclick=()=>runCommand("toggle-arg");

boot().catch(e=>{
  $("#feed").innerHTML=`<div class="empty">No pude cargar el feed: ${esc(e.message)}</div>`;
});
