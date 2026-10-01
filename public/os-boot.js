export const INTRO_KEY="jobas:intro:v2";

export function initBoot({onDone=()=>{},doc=globalThis.document,storage=globalThis.localStorage}={}){
  const root=doc?.querySelector("#intro");
  if(!root)return{open(){},close(){}};

  const remember=doc.querySelector("#introRemember");
  const enter=doc.querySelector("#introEnter");
  const app=doc.querySelector(".app-shell");
  const seen=()=>{try{return storage?.getItem(INTRO_KEY)==="seen";}catch{return false;}};
  const saveSeen=()=>{if(!remember?.checked)return;try{storage?.setItem(INTRO_KEY,"seen");}catch{}};

  const close=(choice=null)=>{
    saveSeen();
    root.hidden=true;
    if(app)app.inert=false;
    onDone({choice});
  };
  const open=()=>{
    root.hidden=false;
    if(app)app.inert=true;
    enter?.focus({preventScroll:true});
  };

  root.addEventListener("click",e=>{
    const mode=e.target.closest("[data-intro-mode]")?.dataset.introMode;
    if(mode){close(mode);return;}
    if(e.target===enter)close(null);
  });
  doc.addEventListener("keydown",e=>{
    if(root.hidden)return;
    if(e.key==="Escape"){close(null);return;}
    const map={"1":"remote","2":"local","3":"progress","4":"prospects"};
    if(map[e.key]){e.preventDefault();close(map[e.key]);}
  });

  if(seen()){
    root.hidden=true;
    if(app)app.inert=false;
  }else open();

  return{open,close};
}
