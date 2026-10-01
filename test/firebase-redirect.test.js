import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Firebase Hosting es solo una capa de redirección al Worker de Cloudflare",()=>{
  const rc=JSON.parse(fs.readFileSync(".firebaserc","utf8"));
  const config=JSON.parse(fs.readFileSync("firebase.json","utf8"));
  assert.equal(rc.projects.default,"jobas-d3c12");
  assert.equal(config.hosting.site,"jobas");
  assert.equal(config.hosting.rewrites,undefined);
  assert.equal(config.functions,undefined);
  assert.ok(Array.isArray(config.hosting.redirects));
  assert.ok(config.hosting.redirects.every(x=>String(x.destination).startsWith("https://jobas.simondalmasso44.workers.dev")));
});
