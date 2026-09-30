import test from "node:test";
import assert from "node:assert/strict";
import { applicationWorkflow, resolveApplicationMode } from "../public/workflow.js";

test("Telegram y microjobs directos no piden CV",()=>{
  const job={source:"gpt-telegram",sourceName:"Telegram · Drop Shipping Group",url:"https://t.me/example/123"};
  assert.equal(resolveApplicationMode(job),"direct");
  assert.deepEqual(applicationWorkflow(job,false),{
    mode:"direct",
    requiresCv:false,
    progressLabel:"POSTULÉ / CONTACTÉ",
    linkLabel:"POSTULAR / CONTACTAR ↗"
  });
  assert.deepEqual(applicationWorkflow(job,true),{
    mode:"direct",
    requiresCv:false,
    progressLabel:"ESPERANDO RESPUESTA ✓",
    linkLabel:"CHEQUEAR RESPUESTA ↗"
  });
});

test("Workana y Upwork usan flujo de plataforma sin adaptar CV",()=>{
  for(const job of [
    {sourceName:"Workana",url:"https://www.workana.com/job/abc"},
    {sourceName:"Upwork",url:"https://www.upwork.com/jobs/~123"}
  ]){
    assert.equal(resolveApplicationMode(job),"platform");
    assert.equal(applicationWorkflow(job,false).requiresCv,false);
    assert.equal(applicationWorkflow(job,true).progressLabel,"ESPERANDO RESPUESTA ✓");
  }
});

test("una vacante tradicional conserva el flujo con CV",()=>{
  const job={sourceName:"LinkedIn",url:"https://www.linkedin.com/jobs/view/123"};
  assert.equal(resolveApplicationMode(job),"cv");
  assert.deepEqual(applicationWorkflow(job,true),{
    mode:"cv",
    requiresCv:true,
    progressLabel:"EN CURSO ✓",
    linkLabel:"Aplicar ↗"
  });
});

test("applicationMode explícito manda sobre la inferencia",()=>{
  assert.equal(resolveApplicationMode({applicationMode:"cv",sourceName:"Telegram"}),"cv");
  assert.equal(resolveApplicationMode({applicationMode:"direct",sourceName:"LinkedIn"}),"direct");
});
