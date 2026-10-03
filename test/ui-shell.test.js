import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { safeExternalHref, sameJob } from "../public/workflow.js";

test("desktop usa controles reales para abrir las áreas de JOBAS",()=>{
  const html=fs.readFileSync("public/index.html","utf8");
  for(const win of ["profile","searches","applications","favorites","folders","offers","coach"]){
    assert.match(html,new RegExp(`(?:data-window-open|data-window)="${win}"`));
  }
  assert.match(html,/id="startButton"/);
  assert.match(html,/id="profileForm"/);
  assert.match(html,/id="q"/);
  assert.doesNotMatch(html,/PRESS ANY KEY TO BOOT|id="termForm"|Command Prompt/i);
});

test("layout desktop usa ventanas clásicas y tiene fallback móvil sin overflow intencional",()=>{
  const css=fs.readFileSync("public/styles.css","utf8");
  assert.match(css,/\.desktop\s*\{/);
  assert.match(css,/\.retro-window\s*\{/);
  assert.match(css,/\.taskbar\s*\{/);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/width:100%!?/);
  assert.match(css,/min-height:100dvh/);
});

test("trabajos sin id ni URL no colisionan entre sí",()=>{
  assert.equal(sameJob({title:"A",company:"Uno",url:""},{title:"B",company:"Dos",url:""}),false);
  assert.equal(sameJob({id:"same",url:""},{id:"same",url:""}),true);
  assert.equal(sameJob({sourceUrl:"https://example.com/post/1"},{sourceUrl:"https://example.com/post/1"}),true);
});

test("links externos rechazan protocolos ejecutables",()=>{
  assert.equal(safeExternalHref("javascript:alert(1)"),"");
  assert.equal(safeExternalHref("data:text/html,boom"),"");
  assert.equal(safeExternalHref("https://example.com/x"),"https://example.com/x");
});
