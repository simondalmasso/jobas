import test from "node:test";
import assert from "node:assert/strict";
import {parseCommand,executeCommand,BAD_COMMAND} from "../public/os-commands.js";

function ctx(){
  const calls=[],state={mode:"remote",query:"",sound:true};
  return{
    calls,state,
    sound:{isEnabled:()=>state.sound,setEnabled:v=>{state.sound=v;},toggle:()=>{state.sound=!state.sound;}},
    snapshot:()=>({mode:state.mode,loaded:true,visible:4,counts:{remote:4,local:2,progress:1,prospects:3},feed:{jobsCount:10,health:[{state:"healthy"}]}}),
    setMode:m=>{state.mode=m;calls.push(["mode",m]);},
    find:q=>{state.query=q;return{count:2,mode:state.mode,others:{}};},
    resetFilters:()=>calls.push(["reset"]),
    openSources:()=>calls.push(["sources"]),
    reboot:()=>calls.push(["reboot"])
  };
}
test("parser normaliza comando y argumentos",()=>assert.deepEqual(parseCommand(' find "meta ads" '),{name:"FIND",args:"meta ads",raw:'find "meta ads"'}));
test("comandos de vista actuan sobre la app",async()=>{
  const c=ctx(); await executeCommand("LOCAL",c); assert.deepEqual(c.calls,[["mode","local"]]);
  await executeCommand("PROSPECTOS",c); assert.deepEqual(c.calls.at(-1),["mode","prospects"]);
});
test("FIND y comandos de sistema son reales",async()=>{
  const c=ctx(); const r=await executeCommand("find marketing",c); assert.equal(c.state.query,"marketing"); assert.match(r.lines[0].text,/2 resultado/);
  await executeCommand("mute",c); assert.equal(c.state.sound,false);
  await executeCommand("reboot",c); assert.deepEqual(c.calls.at(-1),["reboot"]);
});
test("comando invalido no ejecuta acciones",async()=>{
  const c=ctx(); const r=await executeCommand("FORMAT C:",c); assert.equal(r.ok,false); assert.equal(r.lines[0].text,BAD_COMMAND); assert.equal(c.calls.length,0);
});
