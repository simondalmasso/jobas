const FAVORITES_KEY="jobas:favorites:v1";
const SEARCHES_KEY="jobas:searches:v1";
const FOLDERS_KEY="jobas:folders:v1";

const parse=(storage,key,fallback)=>{
  try{const raw=storage?.getItem(key);return raw?JSON.parse(raw):fallback;}catch{return fallback;}
};
const save=(storage,key,value)=>{try{storage?.setItem(key,JSON.stringify(value));}catch{}return value;};
const jobKey=job=>String(job?.id||job?.url||job?.sourceDetail||`${job?.company||""}|${job?.title||""}`);

export function createUserMemory(storage=globalThis.localStorage){
  return{
    favorites(){return parse(storage,FAVORITES_KEY,[]);},
    isFavorite(job){const key=jobKey(job);return this.favorites().some(x=>jobKey(x)===key);},
    toggleFavorite(job){
      const items=this.favorites();
      const key=jobKey(job);
      const i=items.findIndex(x=>jobKey(x)===key);
      if(i>=0)items.splice(i,1); else items.unshift(job);
      return save(storage,FAVORITES_KEY,items);
    },
    searches(){return parse(storage,SEARCHES_KEY,[]);},
    saveSearch(search){
      const item={id:search?.id||cryptoId(),name:String(search?.name||search?.query||"Búsqueda").trim(),query:String(search?.query||"").trim(),mode:String(search?.mode||"remote"),createdAt:search?.createdAt||new Date().toISOString()};
      const items=this.searches().filter(x=>x.id!==item.id);
      items.unshift(item);
      save(storage,SEARCHES_KEY,items);
      return item;
    },
    removeSearch(id){return save(storage,SEARCHES_KEY,this.searches().filter(x=>x.id!==id));},
    folders(){return parse(storage,FOLDERS_KEY,[]);},
    addFolder(name){
      const item={id:cryptoId(),name:String(name||"Nueva carpeta").trim()||"Nueva carpeta",items:[]};
      const folders=this.folders();folders.push(item);save(storage,FOLDERS_KEY,folders);return item;
    },
    addToFolder(folderId,job){
      const folders=this.folders();
      const folder=folders.find(x=>x.id===folderId);
      if(!folder)return null;
      folder.items=Array.isArray(folder.items)?folder.items:[];
      const key=jobKey(job);
      if(!folder.items.some(x=>jobKey(x)===key))folder.items.unshift(job);
      save(storage,FOLDERS_KEY,folders);return folder;
    },
    removeFolder(id){return save(storage,FOLDERS_KEY,this.folders().filter(x=>x.id!==id));}
  };
}

function cryptoId(){
  try{return globalThis.crypto?.randomUUID?.()||`m-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}
  catch{return`m-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}
}