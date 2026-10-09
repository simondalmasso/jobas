// Provenance labels describe published metadata, not a live vacancy audit.
// Never interpret a healthy source fetch or a quality score as link verification.
const parseDate = value => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

export function opportunityProvenance(job = {}, now = Date.now()) {
  const published = parseDate(job.publishedAt);
  const verified = parseDate(job.verifiedAt);
  const expires = parseDate(job.expiresAt);
  const age = published === null ? null : Math.max(0, Math.floor((now - published) / 86400000));
  const expired = expires !== null && expires < now;
  const old = age !== null && age > 30;
  const future = published !== null && published > now + 86400000;
  let freshness = "Fecha no informada · comprobar vigencia";
  if (expired) freshness = "Fecha de cierre superada";
  else if (future) freshness = "Fecha futura · comprobar publicación";
  else if (old) freshness = `Publicada hace ${age} días · comprobar vigencia`;
  else if (age !== null) freshness = age === 0 ? "Publicada hoy (según fuente)" : `Publicada hace ${age} día${age === 1 ? "" : "s"} (según fuente)`;
  const verifiedDays = verified === null ? null : Math.max(0, Math.floor((now - verified) / 86400000));
  const verification = verifiedDays === null
    ? "Vigencia no verificada"
    : verifiedDays > 14
      ? "Última verificación declarada: más de 14 días"
      : "Verificación declarada en ficha · revisar enlace";
  return {freshness, verification, needsReview: expired || future || old || published === null || verifiedDays === null || verifiedDays > 14};
}
