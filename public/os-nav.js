export function createNav({doc=globalThis.document,audio}={}){
  let selected=-1;
  const cards=()=>[...doc.querySelectorAll("#feed .job")];
  const mark=i=>{
    const list=cards();if(!list.length){selected=-1;return;}
    selected=Math.max(0,Math.min(i,list.length-1));
    list.forEach((el,n)=>el.classList.toggle("os-selected",n===selected));
    list[selected]?.scrollIntoView({block:"nearest"});
  };
  doc.addEventListener("keydown",e=>{
    const typing=/INPUT|TEXTAREA|SELECT/.test(doc.activeElement?.tagName||"");
    if(typing||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key==="ArrowDown"){e.preventDefault();mark(selected<0?0:selected+1);audio?.play?.("key");}
    if(e.key==="ArrowUp"){e.preventDefault();mark(selected<0?0:selected-1);audio?.play?.("key");}
    if(e.key==="Home"){e.preventDefault();mark(0);}
    if(e.key==="End"){e.preventDefault();mark(cards().length-1);}
    if(e.key==="Enter"&&selected>=0){
      const card=cards()[selected]; const action=card?.querySelector(".apply")||card?.querySelector(".adapt")||card?.querySelector("[data-action='progress']");
      if(action){e.preventDefault();action.click();}
    }
  });
  return{reset(){selected=-1;cards().forEach(x=>x.classList.remove("os-selected"));}};
}
