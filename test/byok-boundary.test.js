import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Worker source never handles provider credentials or AI payloads",()=>{
  const src=fs.readdirSync("src").filter(x=>x.endsWith(".js")).map(x=>fs.readFileSync("src/"+x,"utf8")).join("\n");
  assert.doesNotMatch(src,/Authorization\s*:\s*\`?Bearer|apiKey|chat\/completions|file-parser|OPENROUTER_NOT_CONNECTED/i);
});

test("browser is the only OpenRouter execution boundary",()=>{
  const coach=fs.readFileSync("public/coach.js","utf8");
  assert.match(coach,/https:\/\/openrouter\.ai/);
  assert.match(coach,/sessionStorage/);
  assert.match(coach,/localStorage/);
  assert.match(coach,/OPENROUTER_STATE_MISMATCH/);
  assert.match(coach,/SPEECH_RECOGNITION_UNAVAILABLE/);
});
