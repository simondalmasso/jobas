import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { safeExternalHref, sameJob } from "../public/workflow.js";

test("menu principal usa controles reales y no etiquetas decorativas",()=>{
  const html=fs.readFileSync("public/index.html","utf8");
  for(const menu of ["jobas","filters","view","panel","help"]){
    assert.match(html,new RegExp(`data-menu-trigger="${menu}"`));
  }
  assert.doesNotMatch(html,/<span>File<\/span>|<span>Options<\/span>|<span>View<\/span>|<span>Tree<\/span>|<span>Help<\/span>/);
});

test("layout desktop usa directorio angosto y resultados ocupan la pantalla",()=>{
  const css=fs.readFileSync("public/styles.css","utf8");
  assert.match(css,/grid-template-columns:190px minmax\(0,1fr\)/);
  assert.match(css,/height:100dvh/);
  assert.match(css,/grid-template-rows:auto minmax\(0,1fr\) auto auto/);
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
