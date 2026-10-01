import test from "node:test";
import assert from "node:assert/strict";
import {createAudio,SOUND_KEY} from "../public/os-audio.js";

test("preferencia de sonido persiste sin requerir AudioContext",()=>{
  const map=new Map();
  const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  const a=createAudio({storage,AudioCtx:null});
  assert.equal(a.isEnabled(),true);
  a.setEnabled(false);assert.equal(map.get(SOUND_KEY),"off");assert.equal(a.isEnabled(),false);
  a.toggle();assert.equal(map.get(SOUND_KEY),"on");
});
