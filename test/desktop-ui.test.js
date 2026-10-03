import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html=()=>fs.readFileSync("public/index.html","utf8");
const css=()=>fs.readFileSync("public/styles.css","utf8");
const app=()=>fs.readFileSync("public/app.js","utf8");

test("desktop exposes profile, memory folders and primary actions",()=>{
  const h=html();
  for(const token of [
    'data-window-open="profile"',
    'data-window-open="searches"',
    'data-window-open="applications"',
    'data-window-open="favorites"',
    'id="profileWindow"',
    'id="offersWindow"',
    'id="coachWindow"',
    'id="actionOffers"',
    'id="actionApply"',
    'id="actionCoach"',
    'id="actionPersonalized"'
  ]) assert.ok(h.includes(token),token);
});

test("profile can be completed manually or from a CV",()=>{
  const h=html();
  assert.match(h,/id="profileForm"/);
  assert.match(h,/id="cvInput"/);
  assert.match(h,/Completar manualmente/i);
  assert.match(h,/Subir CV/i);
});

test("coach exposes user-owned provider connection plus text and audio controls",()=>{
  const h=html();
  assert.match(h,/id="coachConnect"/);
  assert.match(h,/OpenRouter/i);
  assert.match(h,/id="coachInput"/);
  assert.match(h,/id="coachSend"/);
  assert.match(h,/id="coachMic"/);
  assert.match(h,/id="coachSpeak"/);
  assert.match(h,/id="coachDisconnect"/);
});

test("UI is retro desktop, not fake OS emulation",()=>{
  const h=html(), c=css();
  assert.doesNotMatch(h,/PRESS ANY KEY TO BOOT|Command Prompt/i);
  assert.match(c,/\.desktop\s*\{/);
  assert.match(c,/\.retro-window\s*\{/);
  assert.match(c,/\.taskbar\s*\{/);
});

test("frontend imports profile and coach modules while backend stays AI-free",()=>{
  const a=app();
  const worker=fs.readFileSync("src/index.js","utf8");
  assert.match(a,/\.\/profile\.js/);
  assert.match(a,/\.\/coach\.js/);
  assert.doesNotMatch(worker,/fetch\([^\n]*openrouter|chat\/completions|transcription/i);
  assert.match(worker,/connect-src 'self' https:\/\/openrouter\.ai/);
});

test("window focus does not re-cover an opened action and mobile uses one active window",()=>{
  const a=app();
  assert.match(a,/addEventListener\("pointerdown"/);
  assert.match(a,/matchMedia[^\n]*max-width:700px/);
  assert.match(a,/if\(mobile\)\$\$\("\.retro-window"\)\.forEach/);
});


test("desktop suma utilidades livianas, branding superior y Penny",()=>{
  const h=html();
  for(const token of [
    'id="desktopBrand"',
    'data-window-open="notes"',
    'data-window-open="paint"',
    'data-window-open="game"',
    'id="notesWindow"',
    'id="paintWindow"',
    'id="gameWindow"',
    'id="pennyLauncher"',
    'id="pennyWindow"',
    'id="pennyInput"',
    'id="pennySend"'
  ]) assert.ok(h.includes(token),token);
});

test("Penny usa Hugging Face desde el navegador, no el Worker",()=>{
  const penny=fs.readFileSync("public/penny.js","utf8");
  const worker=fs.readFileSync("src/index.js","utf8");
  assert.match(penny,/router\.huggingface\.co\/v1\/chat\/completions/);
  assert.doesNotMatch(penny,/workers\.dev|\/api\/penny|\/api\/ai/);
  assert.doesNotMatch(worker,/huggingface|router\.huggingface\.co/i);
});


test("bringToFront limpia foco sobre todas las ventanas sin error",()=>{
  const a=app();
  const block=a.match(/function bringToFront\(el\)\{([\s\S]*?)\n\}/)?.[1]||"";
  assert.match(block,/\$\$\("\.retro-window"\)\.forEach\(x=>x\.classList\.remove\("is-active"\)\)/);
});


test("Penny acompaña la UX como launcher chico y panel compacto",()=>{
  const c=css();
  assert.match(c,/\.penny-launcher\{[^}]*width:44px[^}]*height:44px/s);
  assert.match(c,/\.penny-window\{[^}]*width:min\(360px,[^}]*right:12px[^}]*bottom:48px[^}]*top:auto/s);
  assert.match(c,/\.penny-avatar\{[^}]*width:36px[^}]*height:36px/s);
});
