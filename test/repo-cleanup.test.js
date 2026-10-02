import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("JOBAS entra directo a la interfaz principal",()=>{
  const html=fs.readFileSync("public/index.html","utf8");
  const app=fs.readFileSync("public/app.js","utf8");
  assert.doesNotMatch(html,/PRESS ANY KEY TO BOOT|id="boot"|id="termForm"|PROSPECTOS MICROJOBS/);
  assert.doesNotMatch(app,/os-boot|os-shell|os-nav|os-commands|selectMode\("prospects"\)/);
  assert.match(html,/data-mode="remote"/);
  assert.match(html,/data-mode="local"/);
  assert.match(html,/data-mode="progress"/);
});

test("data conserva únicamente LOCAL y REMOTO",()=>{
  const files=fs.readdirSync("data").filter(x=>x.endsWith(".json")).sort();
  assert.deepEqual(files,["gpt-local.json","gpt-remoto.json"]);
});

test("no quedan módulos del experimento OS",()=>{
  for(const path of [
    "public/os-audio.js",
    "public/os-boot.js",
    "public/os-commands.js",
    "public/os-nav.js",
    "public/os-shell.js"
  ]) assert.equal(fs.existsSync(path),false,path);
});
