import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html=()=>fs.readFileSync("public/index.html","utf8");
const css=()=>fs.readFileSync("public/styles.css","utf8");

test("JOBAS usa una interfaz retro práctica, no una consola DOS",()=>{
  const h=html();
  assert.match(h,/class="app-menubar"/);
  assert.match(h,/class="tool-strip"/);
  assert.match(h,/class="workspace"/);
  assert.match(h,/id="q"/);
  assert.match(h,/id="feed"/);
  assert.match(h,/PROSPECTOS MICROJOBS/);
  assert.doesNotMatch(h,/id="termForm"|id="termInput"|PRESS ANY KEY TO BOOT|Bad command or file name/);
});

test("la estética toma lenguaje DOS/Word clásico sin chrome moderno",()=>{
  const c=css();
  assert.match(c,/--dos-blue:/);
  assert.match(c,/--dos-cyan:/);
  assert.match(c,/--dos-gray:/);
  assert.match(c,/border-radius:0/);
  assert.match(c,/font-family:[^;]*(Courier|monospace)/i);
});

test("la pantalla inicial es opcional y orientada a tareas",()=>{
  const h=html();
  assert.match(h,/id="intro"/);
  assert.match(h,/Entrar a JOBAS/);
  assert.match(h,/data-intro-mode="remote"/);
  assert.match(h,/data-intro-mode="prospects"/);
});
