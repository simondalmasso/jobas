import test from "node:test";
import assert from "node:assert/strict";
import {opportunityProvenance} from "../public/provenance.js";
import {normalizePublicationDate} from "../src/sources.js";

const NOW=Date.parse("2026-10-09T12:00:00Z");
test("RSS RFC-822 dates are normalized to ISO for age and source auditing",()=>{
  assert.equal(normalizePublicationDate("Thu, 08 Oct 2026 07:31:21 +0000"),"2026-10-08T07:31:21.000Z");
  assert.equal(normalizePublicationDate("not a date"),null);
  assert.equal(normalizePublicationDate(null),null);
});
test("public vacancy without verifiedAt is never labeled as verified",()=>{
  const p=opportunityProvenance({publishedAt:"2026-10-08T12:00:00Z"},NOW);
  assert.match(p.freshness,/1 día/);
  assert.equal(p.verification,"Vigencia no verificada");
  assert.equal(p.needsReview,true);
});
test("old and undated vacancies explicitly request freshness checks",()=>{
  const old=opportunityProvenance({publishedAt:"2026-08-01T12:00:00Z"},NOW);
  assert.match(old.freshness,/comprobar vigencia/);
  const noDate=opportunityProvenance({},NOW);
  assert.match(noDate.freshness,/Fecha no informada/);
});
test("declared verification date is not mistaken for live link verification",()=>{
  const p=opportunityProvenance({publishedAt:"2026-10-08T12:00:00Z",verifiedAt:"2026-10-08T12:00:00Z"},NOW);
  assert.match(p.verification,/Verificación declarada/);
  assert.equal(p.needsReview,false);
  const expired=opportunityProvenance({expiresAt:"2026-10-08T12:00:00Z"},NOW);
  assert.match(expired.freshness,/cierre superada/);
});
