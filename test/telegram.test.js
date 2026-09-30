import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

test("Telegram radar tracks every requested chat with stable chat ids", () => {
  const data = readJson("../data/telegram-sources.json");
  const byId = new Map(data.sources.map((source) => [source.id, source]));
  for (const id of ["laravel-es","prestashop-es","php-es","angular-es","vue-es","java-es","kotlin-devs"]) {
    assert.equal(byId.get(id)?.enabled, true, id);
    assert.match(String(byId.get(id)?.chatId || ""), /^-100\d+$/, id);
    assert.match(String(byId.get(id)?.webUrl || ""), /^https:\/\/web\.telegram\.org\/a\/#-100\d+$/, id);
  }
});

test("Telegram radar persists an incremental source cursor for each enabled chat", () => {
  const sources = readJson("../data/telegram-sources.json").sources.filter((source) => source.enabled);
  const radar = readJson("../data/gpt-telegram.json");
  assert.ok(radar.updatedAt, "updatedAt must record a completed radar pass");
  assert.ok(Array.isArray(radar.findings));
  assert.equal(typeof radar.sourceState, "object");
  for (const source of sources) {
    assert.ok(radar.sourceState[source.id], source.id);
    assert.ok(["ok","loading","unavailable"].includes(radar.sourceState[source.id].status), source.id);
    if (radar.sourceState[source.id].lastSeenMessageId != null) {
      assert.match(String(radar.sourceState[source.id].lastSeenMessageId), /^\d+$/, source.id);
    }
  }
});
