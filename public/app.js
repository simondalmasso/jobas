import { applicationHref, applicationWorkflow, safeExternalHref, sameJob } from "./workflow.js";
import { createProfileStore, normalizeProfile, profileComplete } from "./profile.js";
import {
  createCredentialStore,
  createSpeechController,
  startOpenRouterOAuth,
  finishOpenRouterOAuth,
  sendCoachMessage,
  extractProfileFromCv,
  buildInterviewSystemPrompt
} from "./coach.js";
import { createUserMemory } from "./user-memory.js";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

const PROFILE= createProfileStore();
const MEMORY=createUserMemory();
const CREDENTIALS=createCredentialStore();
const SPEECH=createSpeechController();
const PROGRESS_KEY="jobas:in-progress:v1";

const state={
  jobs:[],
  feed:null,
  category:"",
  knownPay:false,
  argOnly:true,
  mode:"remote",
  personalized:false,
  profile:PROFILE.load(),
  coachHistory:[],
  z:90
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

function toast(message,error=false){
  const el=$("#toast");
  clearTimeout(toast.timer);
  el.textContent=message;
  el.style.background=error?"#ffd5d5":"#fff5b4";
  el.hidden=false;
  toast.timer=setTimeout(()=>{el.hidden=true;},3200);
}

function getProgressJobs(){
  try{
    const value=JSON.parse(localStorage.getItem(PROGRESS_KEY)||"[]");
    return Array.isArray(value)?value:[];
  }catch{return[];}
}
function setProgressJobs(jobs){
  localStorage.setItem(PROGRESS_KEY,JSON.stringify(jobs));
  updateProgressCount();
  renderApplications();
}
function progressHas(job){return getProgressJobs().some(x=>sameJob(x,job));}
function toggleProgress(job){
  const jobs=getProgressJobs();
  const i=jobs.findIndex(x=>sameJob(x,job));
  if(i>=0)jobs.splice(i,1);else jobs.unshift(job);
  setProgressJobs(jobs);
  renderCategories();
  renderFeed();
}
function updateProgressCount(){
  const el=$("#progressCount");
  if(el)el.textContent=getProgressJobs().length;
}

function isLocalJob(job){
  if(job.lane==="LOCAL")return true;
  if(job.lane==="REMOTO")return false;
  const text=(String(job.location||"")+" "+String(job.description||"")).toLowerCase();
  return /santa fe|santo tom[eé]|paran[aá]|presencial|h[ií]brido/.test(text)&&!/worldwide|anywhere|latam|latin america/.test(text);
}

function monthly(job){
  const p=job.pay||{};
  if(!p.monthlyMin&&!p.monthlyMax)return"Pago no publicado";
  const f=n=>new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(n);
  const cur=p.currency||"USD";
  const amount=p.monthlyMin&&p.monthlyMax&&p.monthlyMin!==p.monthlyMax
    ?`${f(p.monthlyMin)}–${f(p.monthlyMax)}`
    :f(p.monthlyMin||p.monthlyMax);
  return `${p.estimateBasis?"≈ ":""}${cur} ${amount} / mes`;
}

function profileTerms(){
  return state.profile.targetRoles.flatMap(r=>r.toLowerCase().split(/[^a-záéíóúñ0-9+#.]+/i)).filter(x=>x.length>=3);
}
function personalizedJobs(){
  const allowed=new Set(state.profile.modes);
  const terms=profileTerms();
  return state.jobs.filter(j=>{
    if(isLocalJob(j)&&!allowed.has("local"))return false;
    if(!isLocalJob(j)&&!allowed.has("remote")&&!allowed.has("microjobs"))return false;
    if(!terms.length)return true;
    const text=`${j.title} ${j.company} ${j.description||""} ${labels[j.category]||j.category}`.toLowerCase();
    return terms.some(t=>text.includes(t));
  });
}
function baseForMode(){
  if(state.personalized)return personalizedJobs();
  if(state.mode==="progress")return getProgressJobs();
  if(state.mode==="local")return state.jobs.filter(isLocalJob);
  return state.jobs.filter(j=>!isLocalJob(j));
}
function filtered(){
  const q=($("#q")?.value||"").trim().toLowerCase();
  const argentinaFilterApplies=!state.personalized&&(state.mode==="remote"||state.mode==="local");
  return baseForMode().filter(j=>
    (!q||`${j.title} ${j.company} ${j.buyer||""} ${j.description||""}`.toLowerCase().includes(q)) &&
    (!state.category||j.category===state.category) &&
    (!state.knownPay||(j.pay?.monthlyMin||j.pay?.monthlyMax)) &&
    (!state.argOnly||!argentinaFilterApplies||j.argentina?.score>=80)
  );
}

function requireProfile(action){
  if(profileComplete(state.profile))return true;
  openWindow("profile");
  $("#profileEditor").open=true;
  toast(`Completá tu perfil para ${action}.`,true);
  return false;
}

function openWindow(name){
  const el=document.querySelector(`[data-window="${CSS.escape(name)}"]`);
  if(!el)return;
  el.hidden=false;
  $$(".retro-window").forEach(x=>x.classList.remove("is-active"));
  el.classList.add("is-active");
  el.style.zIndex=String(++state.z);
  $("#startMenu").hidden=true;
  if(name==="applications")renderApplications();
  if(name==="favorites")renderFavorites();
  if(name==="searches")renderSearches();
  if(name==="folders")renderFolders();
  if(name==="coach"){renderCoachJobs();renderCoachProvider();}
}
function closeWindow(name){
  const el=document.querySelector(`[data-window="${CSS.escape(name)}"]`);
  if(el)el.hidden=true;
}
function bringToFront(el){
  if(!el)return;
  $$(".retro-window").forEach(x=>x.classList.remove("is-active"));
  el.classList.add("is-active");
  el.style.zIndex=String(++state.z);
}

function renderProfile(){
  state.profile=PROFILE.load();
  const p=state.profile;
  const complete=profileComplete(p);
  $("#profileState").textContent=complete?"PERFIL LISTO":"PERFIL INCOMPLETO";
  $("#profileName").textContent=p.name||"Tu perfil JOBAS";
  $("#profileHeadline").textContent=p.headline||p.targetRoles.join(" · ")||"Completá qué buscás para personalizar el radar.";
  $("#profileSummary").textContent=[
    p.location,
    p.skills.length?`${p.skills.slice(0,5).join(" · ")}`:"",
    p.languages.length?p.languages.join(" · "):""
  ].filter(Boolean).join(" — ")||"Podés cargarlo manualmente o subir tu CV. Tus datos quedan en este navegador.";
  $("#profileModes").innerHTML=p.modes.map(x=>`<span>${esc(x==="remote"?"Remoto":x==="local"?"Local / presencial":"Microjobs")}</span>`).join("");
  $("#profileRequired").classList.toggle("complete",complete);
  $("#profileRequired").textContent=complete
    ?"Perfil listo. Búsqueda personalizada y Coach IA habilitados."
    :"Para activar búsqueda personalizada, postular y usar Coach IA, completá nombre + objetivo laboral + modalidad.";
  $("#actionApply").disabled=!complete;
  $("#actionCoach").disabled=!complete;
  $("#actionPersonalized").disabled=!complete;
  const initials=(p.name||"J").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  $("#avatarInitials").textContent=initials||"J";
  populateProfileForm(p);
}
function populateProfileForm(p){
  $("#profileNameInput").value=p.name||"";
  $("#profileHeadlineInput").value=p.headline||"";
  $("#profileLocationInput").value=p.location||"";
  $("#profileRolesInput").value=(p.targetRoles||[]).join(", ");
  $("#profileSkillsInput").value=(p.skills||[]).join(", ");
  $("#profileLanguagesInput").value=(p.languages||[]).join(", ");
  $("#profileNotesInput").value=p.notes||"";
  $$('input[name="modes"]').forEach(x=>x.checked=(p.modes||[]).includes(x.value));
}
function formProfile(){
  return normalizeProfile({
    name:$("#profileNameInput").value,
    headline:$("#profileHeadlineInput").value,
    location:$("#profileLocationInput").value,
    targetRoles:$("#profileRolesInput").value,
    skills:$("#profileSkillsInput").value,
    languages:$("#profileLanguagesInput").value,
    notes:$("#profileNotesInput").value,
    modes:$$('input[name="modes"]:checked').map(x=>x.value),
    source:"manual"
  });
}

function selectMode(mode){
  if(!["remote","local","progress"].includes(mode))return;
  state.personalized=false;
  state.mode=mode;
  state.category="";
  $$("[data-mode]").forEach(x=>x.classList.toggle("active",x.dataset.mode===mode));
  renderCategories();
  renderFeed();
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

function renderJobActions(job){
  const inProgress=progressHas(job);
  const flow=applicationWorkflow(job,inProgress);
  const fav=MEMORY.isFavorite(job);
  const applyHref=safeExternalHref(applicationHref(job,inProgress));
  return[
    `<button class="favorite${fav?" active":""}" data-action="favorite" type="button" title="Favorito">${fav?"★":"☆"}</button>`,
    `<button data-action="progress" type="button">${esc(flow.progressLabel)}</button>`,
    `<button class="coach-action" data-action="coach" type="button">ENTREVISTA IA</button>`,
    `<button data-action="folder" type="button">CARPETA</button>`,
    flow.requiresCv?`<button data-action="prepare" type="button">PREPARAR CV</button>`:"",
    applyHref?`<button class="apply" data-action="apply" data-href="${esc(applyHref)}" type="button">${esc(flow.linkLabel)}</button>`:`<span class="manual-status">LINK A VERIFICAR</span>`
  ].join("");
}

function renderFeed(){
  const jobs=filtered();
  const label=state.personalized?"personalizadas":state.mode==="remote"?"remotas":state.mode==="local"?"locales":"en curso";
  const note=state.personalized?"según tu perfil":state.mode==="progress"?"guardadas en este navegador":"ordenadas por prioridad";
  $("#summary").innerHTML=`<span class="pill">${jobs.length} ${label}</span><span class="pill">${note}</span>`;
  $("#feed").innerHTML=jobs.length?jobs.map(j=>`
    <article class="job" data-job-id="${esc(j.id||j.url||j.sourceDetail)}">
      <div>
        <div class="job-title">${esc(j.title)}</div>
        <div class="company">${esc(j.company)}</div>
        <div class="meta">
          <span class="tag">${esc(labels[j.category]||j.category)}</span>
          <span class="tag good">${esc(j.argentina?.label||"A verificar")}</span>
          <span class="tag">${esc(j.location||"Remote")}</span>
          <span class="tag pay">${esc(monthly(j))}</span>
        </div>
        <div class="why">
          <span>Prioridad ${esc(j.priority??"—")}/100</span>
          <span>·</span><span>${esc(j.scam?.label||"")}</span>
        </div>
        <div class="source-row">Fuente: ${safeExternalHref(j.sourceDetail||j.sourceUrl)?`<a href="${esc(safeExternalHref(j.sourceDetail||j.sourceUrl))}" target="_blank" rel="noopener noreferrer">${esc(j.sourceName)}</a>`:esc(j.sourceName||"Manual")}</div>
      </div>
      <div class="actions">${renderJobActions(j)}</div>
    </article>
  `).join(""):`<div class="empty">No hay resultados con estos filtros.</div>`;
  renderCoachJobs();
}
function findJob(id){
  return[...state.jobs,...getProgressJobs(),...MEMORY.favorites()].find(j=>String(j.id||j.url||j.sourceDetail)===String(id));
}

function renderApplications(){
  const jobs=getProgressJobs();
  $("#applicationsList").innerHTML=jobs.length?jobs.map(j=>memoryRow(j,"application")).join(""):'<div class="empty">Todavía no marcaste postulaciones.</div>';
}
function renderFavorites(){
  const jobs=MEMORY.favorites();
  $("#favoritesList").innerHTML=jobs.length?jobs.map(j=>memoryRow(j,"favorite")).join(""):'<div class="empty">Todavía no guardaste favoritos.</div>';
}
function memoryRow(j,type){
  return`<div class="memory-row" data-memory-job="${esc(j.id||j.url||j.sourceDetail)}">
    <div><strong>${esc(j.title)}</strong><small>${esc(j.company)} · ${esc(j.location||"")}</small></div>
    <div class="memory-actions">
      <button class="classic-button" data-memory-open type="button">Abrir</button>
      ${type==="favorite"?'<button class="classic-button" data-memory-remove-favorite type="button">Quitar</button>':""}
    </div>
  </div>`;
}
function renderSearches(){
  const items=MEMORY.searches();
  $("#searchesList").innerHTML=items.length?items.map(x=>`<div class="memory-row" data-search-id="${esc(x.id)}"><div><strong>${esc(x.name)}</strong><small>${esc(x.query||"Sin texto")} · ${esc(x.mode)}</small></div><div class="memory-actions"><button class="classic-button" data-run-search type="button">Abrir</button><button class="classic-button" data-remove-search type="button">Borrar</button></div></div>`).join(""):'<div class="empty">No hay búsquedas guardadas.</div>';
}
function renderFolders(){
  const folders=MEMORY.folders();
  $("#foldersList").innerHTML=folders.length?folders.map(f=>`<section class="folder-card" data-folder-id="${esc(f.id)}"><header><span>📁 ${esc(f.name)}</span><button class="classic-button" data-remove-folder type="button">Borrar</button></header><div class="folder-items">${(f.items||[]).length?(f.items||[]).map(j=>`<div>${esc(j.title)} — ${esc(j.company)}</div>`).join(""):"Carpeta vacía"}</div></section>`).join(""):'<div class="empty">Creá carpetas para organizar oportunidades.</div>';
}
function saveJobToFolder(job){
  let folders=MEMORY.folders();
  if(!folders.length){MEMORY.addFolder("Guardados");folders=MEMORY.folders();}
  const names=folders.map((f,i)=>`${i+1}. ${f.name}`).join("\n");
  const answer=prompt(`Elegí número de carpeta:\n${names}`,"1");
  const index=Number(answer)-1;
  const folder=folders[index];
  if(!folder)return;
  MEMORY.addToFolder(folder.id,job);
  renderFolders();
  toast(`Guardado en ${folder.name}`);
}

function renderCoachJobs(){
  const select=$("#coachJobSelect");
  if(!select)return;
  const current=select.value;
  select.innerHTML='<option value="">Entrevista general</option>'+state.jobs.slice(0,180).map(j=>`<option value="${esc(j.id||j.url||j.sourceDetail)}">${esc(j.title)} — ${esc(j.company)}</option>`).join("");
  if([...select.options].some(x=>x.value===current))select.value=current;
}
function selectedCoachJob(){
  const id=$("#coachJobSelect").value;
  return id?findJob(id):{};
}
function renderCoachProvider(){
  const connected=Boolean(CREDENTIALS.get());
  $("#coachProviderStatus").textContent=connected
    ?"OpenRouter conectado con credencial del usuario. Llamadas directas desde este navegador."
    :"No conectada. JOBAS no paga ni intermedia estas llamadas.";
  $("#coachConnect").hidden=connected;
  $("#coachDisconnect").hidden=!connected;
  $("#taskAiStatus").textContent=connected?"IA: conectada (usuario)":"IA: usuario";
}
function coachMessage(role,text){
  const el=document.createElement("div");
  el.className=`coach-message ${role}`;
  el.textContent=text;
  $("#coachMessages").appendChild(el);
  $("#coachMessages").scrollTop=$("#coachMessages").scrollHeight;
}
async function sendCoach(text){
  if(!requireProfile("usar el Coach IA"))return;
  const key=CREDENTIALS.get();
  if(!key){openWindow("coach");toast("Conectá tu cuenta OpenRouter primero.",true);return;}
  const userText=String(text||"").trim();
  if(!userText)return;
  const mode=$("#coachMode").value;
  const job=selectedCoachJob();
  const system=buildInterviewSystemPrompt({profile:state.profile,job})+
    "\nModo actual: "+(mode==="mock"?"simulación de entrevista":mode==="answer"?"entrenamiento de respuesta":"feedback exigente")+
    "\nRespondé en español salvo que el candidato pida practicar otro idioma.";
  state.coachHistory.push({role:"user",content:userText});
  coachMessage("user",userText);
  $("#coachInput").value="";
  $("#coachSend").disabled=true;
  $("#coachProviderStatus").textContent="Pensando con tu cuenta…";
  try{
    const out=await sendCoachMessage({
      apiKey:key,
      model:$("#coachModel").value.trim()||"openrouter/free",
      messages:[{role:"system",content:system},...state.coachHistory.slice(-12)]
    });
    state.coachHistory.push({role:"assistant",content:out.content});
    coachMessage("assistant",out.content);
    if($("#coachSpeak").checked)SPEECH.speak(out.content,{lang:"es-AR"});
  }catch(e){
    coachMessage("assistant","Error: "+e.message);
    toast("No pude consultar tu proveedor: "+e.message,true);
  }finally{
    $("#coachSend").disabled=false;
    renderCoachProvider();
  }
}
function openCoachForJob(job,prepare=false){
  if(!requireProfile("entrenar entrevistas"))return;
  openWindow("coach");
  renderCoachJobs();
  if(job){
    $("#coachJobSelect").value=String(job.id||job.url||job.sourceDetail);
    if(prepare)$("#coachInput").value=`Ayudame a preparar mi CV y mi presentación para ${job.title} en ${job.company}. Usá solo información real de mi perfil y marcá qué me falta.`;
  }
}

async function processCv(){
  const file=$("#cvInput").files?.[0];
  if(!file){toast("Elegí un CV primero.",true);return;}
  const key=CREDENTIALS.get();
  if(!key){openWindow("coach");toast("Para ordenar el CV conectá primero tu propia cuenta OpenRouter.",true);return;}
  if(file.size>12*1024*1024){toast("CV demasiado grande. Máximo 12 MB.",true);return;}
  $("#cvProcess").disabled=true;
  $("#cvStatus").className="inline-status";
  $("#cvStatus").textContent="Leyendo y ordenando con tu cuenta IA…";
  try{
    const isPdf=file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf");
    let dataUrl="",textContent="";
    if(isPdf)dataUrl=await readFileDataUrl(file);
    else textContent=await file.text();
    const raw=await extractProfileFromCv({
      apiKey:key,
      model:$("#coachModel").value.trim()||"openrouter/free",
      file,dataUrl,textContent
    });
    const parsed=normalizeProfile({...raw,source:"cv"});
    populateProfileForm(parsed);
    $("#profileEditor").open=true;
    $("#cvStatus").textContent="CV ordenado. Revisá los campos y tocá Guardar perfil.";
    toast("CV procesado en tu cuenta. Revisá antes de guardar.");
  }catch(e){
    $("#cvStatus").className="inline-status error";
    $("#cvStatus").textContent=e.message;
    toast("No pude procesar el CV: "+e.message,true);
  }finally{$("#cvProcess").disabled=false;}
}
function readFileDataUrl(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(String(r.result||""));
    r.onerror=()=>reject(r.error||new Error("FILE_READ_FAILED"));
    r.readAsDataURL(file);
  });
}

async function loadFeed(){
  const r=await fetch("/api/feed",{cache:"no-store"});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  const feed=await r.json();
  state.feed=feed;
  state.jobs=feed.jobs||[];
  $("#fresh").textContent=feed.generatedAt?`actualizado ${new Date(feed.generatedAt).toLocaleString("es-AR")}`:"sin actualización";
  $("#taskStatus").textContent=`RADAR: ${state.jobs.length} oportunidades`;
  $("#sourceHealth").innerHTML='<div class="source-grid">'+(feed.health||[]).map(s=>safeExternalHref(s.url)?`<a class="source-card" href="${esc(safeExternalHref(s.url))}" target="_blank" rel="noopener noreferrer"><strong>${esc(s.name)}</strong><br>${esc(s.state)} · ${s.jobs} jobs</a>`:`<div class="source-card"><strong>${esc(s.name)}</strong><br>${esc(s.state)} · ${s.jobs} jobs</div>`).join("")+'</div>';
  $("#discovery").innerHTML='<div class="source-grid">'+(feed.discoverySources||[]).map(s=>safeExternalHref(s.url)?`<a class="source-card" href="${esc(safeExternalHref(s.url))}" target="_blank" rel="noopener noreferrer"><strong>${esc(s.name)}</strong><br>${esc(s.note)}</a>`:`<div class="source-card"><strong>${esc(s.name)}</strong><br>${esc(s.note)}</div>`).join("")+'</div>';
  renderCategories();
  renderFeed();
  renderCoachJobs();
}

async function handleOAuthReturn(){
  if(!new URL(location.href).searchParams.get("code"))return;
  try{
    await finishOpenRouterOAuth();
    renderCoachProvider();
    openWindow("coach");
    toast("OpenRouter conectado. El Coach usa tu cuenta.");
  }catch(e){
    toast("No pude completar la conexión OpenRouter: "+e.message,true);
  }
}

function wireEvents(){
  document.addEventListener("click",e=>{
    const open=e.target.closest("[data-window-open]");
    if(open){openWindow(open.dataset.windowOpen);return;}
    const close=e.target.closest("[data-window-close]");
    if(close){closeWindow(close.dataset.windowClose);return;}
    const mini=e.target.closest("[data-window-minimize]");
    if(mini){closeWindow(mini.dataset.windowMinimize);return;}
    const win=e.target.closest(".retro-window");
    if(win)bringToFront(win);
  });

  $("#startButton").onclick=()=>$("#startMenu").hidden=!$("#startMenu").hidden;
  document.addEventListener("click",e=>{if(!e.target.closest("#startButton")&&!e.target.closest("#startMenu"))$("#startMenu").hidden=true;});

  $("#profileForm").addEventListener("submit",e=>{
    e.preventDefault();
    const profile=formProfile();
    if(!profileComplete(profile)){toast("Falta nombre, objetivo laboral o modalidad.",true);return;}
    PROFILE.save(profile);renderProfile();toast("Perfil guardado en este navegador.");
  });
  $("#profileReset").onclick=()=>{if(confirm("¿Limpiar el perfil guardado en este navegador?")){PROFILE.clear();renderProfile();$("#profileEditor").open=true;}};
  $("[data-profile-edit]").onclick=()=>{$("#profileEditor").open=true;$("#profileNameInput").focus();};

  $("#actionOffers").onclick=()=>{selectMode("remote");openWindow("offers");};
  $("#actionApply").onclick=()=>{if(requireProfile("postular")){selectMode("remote");openWindow("offers");toast("Elegí una oportunidad y tocá Aplicar.");}};
  $("#actionCoach").onclick=()=>{if(requireProfile("usar el Coach IA"))openWindow("coach");};
  $("#actionPersonalized").onclick=()=>{
    if(!requireProfile("usar búsqueda personalizada"))return;
    state.personalized=true;state.category="";renderCategories();renderFeed();openWindow("offers");
  };

  $$(".window-menubar [data-mode],#offersWindow [data-mode]").forEach(b=>b.addEventListener("click",()=>selectMode(b.dataset.mode)));
  $("#categories").addEventListener("click",e=>{const b=e.target.closest("[data-cat]");if(!b)return;state.category=b.dataset.cat;renderCategories();renderFeed();});
  $("#q").addEventListener("input",renderFeed);
  $("#knownPay").onclick=()=>{state.knownPay=!state.knownPay;$("#knownPay").setAttribute("aria-pressed",String(state.knownPay));renderFeed();};
  $("#argOnly").onclick=()=>{state.argOnly=!state.argOnly;$("#argOnly").setAttribute("aria-pressed",String(state.argOnly));renderFeed();};
  $("#saveSearch").onclick=()=>{
    const query=$("#q").value.trim();
    const name=prompt("Nombre de la búsqueda",query||"Búsqueda JOBAS");
    if(!name)return;
    MEMORY.saveSearch({name,query,mode:state.personalized?"personalized":state.mode});
    renderSearches();toast("Búsqueda guardada.");
  };

  $("#feed").addEventListener("click",e=>{
    const card=e.target.closest(".job");if(!card)return;
    const job=findJob(card.dataset.jobId);if(!job)return;
    const action=e.target.closest("[data-action]")?.dataset.action;
    if(!action)return;
    if(action==="favorite"){MEMORY.toggleFavorite(job);renderFeed();renderFavorites();return;}
    if(action==="progress"){if(requireProfile("guardar una postulación"))toggleProgress(job);return;}
    if(action==="coach"){openCoachForJob(job,false);return;}
    if(action==="prepare"){openCoachForJob(job,true);return;}
    if(action==="folder"){saveJobToFolder(job);return;}
    if(action==="apply"){
      if(!requireProfile("postular"))return;
      const href=safeExternalHref(e.target.dataset.href);
      if(href)window.open(href,"_blank","noopener,noreferrer");
    }
  });

  $("#applicationsList").addEventListener("click",handleMemoryClick);
  $("#favoritesList").addEventListener("click",handleMemoryClick);
  $("#searchesList").addEventListener("click",e=>{
    const row=e.target.closest("[data-search-id]");if(!row)return;
    const id=row.dataset.searchId;
    if(e.target.closest("[data-remove-search]")){MEMORY.removeSearch(id);renderSearches();return;}
    if(e.target.closest("[data-run-search]")){
      const s=MEMORY.searches().find(x=>x.id===id);if(!s)return;
      state.personalized=s.mode==="personalized";
      if(!state.personalized)selectMode(["remote","local","progress"].includes(s.mode)?s.mode:"remote");
      $("#q").value=s.query||"";renderCategories();renderFeed();openWindow("offers");
    }
  });
  $("#addFolder").onclick=()=>{const name=$("#newFolderName").value.trim();if(!name)return;MEMORY.addFolder(name);$("#newFolderName").value="";renderFolders();};
  $("#foldersList").addEventListener("click",e=>{const card=e.target.closest("[data-folder-id]");if(!card)return;if(e.target.closest("[data-remove-folder]")){MEMORY.removeFolder(card.dataset.folderId);renderFolders();}});

  $("#coachConnect").onclick=()=>startOpenRouterOAuth();
  $("#coachDisconnect").onclick=()=>{CREDENTIALS.clear();state.coachHistory=[];renderCoachProvider();toast("Cuenta IA desconectada de este navegador.");};
  $("#coachUseKey").onclick=()=>{
    const key=$("#coachKeyInput").value.trim();
    if(!key){toast("Pegá una API key propia.",true);return;}
    CREDENTIALS.set(key,$("#coachRemember").checked);$("#coachKeyInput").value="";renderCoachProvider();toast("Key guardada solo en este navegador.");
  };
  $("#coachSend").onclick=()=>sendCoach($("#coachInput").value);
  $("#coachStart").onclick=()=>sendCoach($("#coachMode").value==="mock"?"Comenzá la entrevista. Hacé una sola pregunta por vez y esperá mi respuesta.":"Dame una consigna breve para practicar una respuesta de entrevista.");
  $("#coachInput").addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();sendCoach($("#coachInput").value);}});
  $("#coachMic").onclick=()=>{
    if(!SPEECH.recognitionSupported){toast("Este navegador no ofrece reconocimiento de voz. Usá texto.",true);return;}
    $("#coachMic").disabled=true;$("#coachMic").textContent="Escuchando…";
    SPEECH.listen({
      lang:"es-AR",
      onText:text=>{$("#coachInput").value=text;$("#coachMic").disabled=false;$("#coachMic").textContent="🎙 Audio";},
      onError:err=>{$("#coachMic").disabled=false;$("#coachMic").textContent="🎙 Audio";toast(err.message,true);}
    });
  };

  $("#cvProcess").onclick=processCv;

  document.addEventListener("keydown",e=>{
    if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||""))return;
    if(e.key==="/"){e.preventDefault();openWindow("offers");$("#q").focus();}
    if(e.key==="1"){selectMode("remote");openWindow("offers");}
    if(e.key==="2"){selectMode("local");openWindow("offers");}
    if(e.key==="3"){selectMode("progress");openWindow("offers");}
  });
}
function handleMemoryClick(e){
  const row=e.target.closest("[data-memory-job]");if(!row)return;
  const job=findJob(row.dataset.memoryJob);if(!job)return;
  if(e.target.closest("[data-memory-remove-favorite]")){MEMORY.toggleFavorite(job);renderFavorites();renderFeed();return;}
  if(e.target.closest("[data-memory-open]")){openWindow("offers");$("#q").value=job.title;renderFeed();}
}

function tickClock(){
  $("#taskClock").textContent=new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
}

async function boot(){
  wireEvents();
  renderProfile();
  renderApplications();renderFavorites();renderSearches();renderFolders();renderCoachProvider();
  tickClock();setInterval(tickClock,30000);
  await handleOAuthReturn();
  try{await loadFeed();}
  catch(e){$("#taskStatus").textContent="RADAR: error";$("#feed").innerHTML=`<div class="empty">No pude cargar el feed: ${esc(e.message)}</div>`;toast("Error cargando radar: "+e.message,true);}
}

boot();
