import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("JOBAS tiene fuente CANON separada para prospectos microjobs",()=>{
  const data=JSON.parse(fs.readFileSync("data/gpt-prospectos.json","utf8"));
  assert.equal(data.lane,"PROSPECTOS");
  assert.equal(data.findingSchema.prospectType,"microjob");
  assert.match(data.writeContract,/GitHub main/);
  assert.ok(Array.isArray(data.findings));
});

test("el feed consume gpt-prospectos y preserva campos de prospección",()=>{
  const src=fs.readFileSync("src/index.js","utf8");
  assert.match(src,/gpt-prospectos\.json/);
  assert.match(src,/prospectType:x\.prospectType/);
  assert.match(src,/buyer:x\.buyer/);
});

test("la UI muestra PROSPECTOS MICROJOBS como modo separado",()=>{
  const html=fs.readFileSync("public/index.html","utf8");
  const app=fs.readFileSync("public/app.js","utf8");
  assert.match(html,/data-mode="prospects"[^>]*>PROSPECTOS MICROJOBS/);
  assert.match(app,/state\.mode==="prospects"/);
  assert.match(app,/isProspect/);
});
