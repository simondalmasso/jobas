export const PROFILE_KEY="jobas:profile:v1";
export const PROFILE_MODES=["remote","local","microjobs"];

const text=v=>String(v??"").trim();
const list=v=>{
  const raw=Array.isArray(v)?v:String(v??"").split(",");
  return [...new Set(raw.map(text).filter(Boolean))];
};

export function normalizeProfile(input={}){
  const modes=list(input.modes).map(x=>x.toLowerCase()).filter(x=>PROFILE_MODES.includes(x));
  return{
    name:text(input.name),
    headline:text(input.headline),
    location:text(input.location),
    targetRoles:list(input.targetRoles),
    modes:[...new Set(modes)],
    skills:list(input.skills),
    languages:list(input.languages),
    notes:text(input.notes),
    source:text(input.source)||"manual",
    updatedAt:input.updatedAt||new Date().toISOString()
  };
}

export function profileComplete(input={}){
  const p=normalizeProfile(input);
  return Boolean(p.name&&p.targetRoles.length&&p.modes.length);
}

export function createProfileStore(storage=globalThis.localStorage){
  const blank=()=>normalizeProfile({updatedAt:null});
  return{
    load(){
      try{
        const raw=storage?.getItem(PROFILE_KEY);
        return raw?normalizeProfile(JSON.parse(raw)):blank();
      }catch{return blank();}
    },
    save(profile){
      const value=normalizeProfile(profile);
      storage?.setItem(PROFILE_KEY,JSON.stringify(value));
      return value;
    },
    clear(){try{storage?.removeItem(PROFILE_KEY);}catch{}},
    complete(){return profileComplete(this.load());}
  };
}