import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {promptFor,createHistory} from "../public/os-shell.js";

test("prompt refleja directorio virtual",()=>{
  assert.equal(promptFor("remote"),"C:\\JOBAS\\REMOTO>");
  assert.equal(promptFor("prospects"),"C:\\JOBAS\\PROSPECTOS>");
});
test("historial navega sin duplicados consecutivos",()=>{
  const h=createHistory(3);h.push("dir");h.push("dir");h.push("local");
  assert.equal(h.prev(),"local");assert.equal(h.prev(),"dir");assert.equal(h.next(),"local");
});
test("markup incluye boot y consola reales",()=>{
  const html=fs.readFileSync("public/index.html","utf8");
  assert.match(html,/id="boot"[^>]+role="dialog"/);
  assert.match(html,/COMPUTER JOB ASSISTANT/);
  assert.match(html,/PRESS ANY KEY TO BOOT/);
  assert.match(html,/id="termForm"/);
  assert.match(html,/id="termInput"/);
  assert.doesNotMatch(html,/<img[^>]+boot/i);
});
