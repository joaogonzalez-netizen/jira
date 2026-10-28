/**
 * Links anexados a iniciativas e oportunidades (estudos, dashboards, docs):
 * [{ label, url }]. Só http/https — nada de `javascript:` virando link na tela.
 */
const MAX_LINKS = 20;

export function cleanLinks(value) {
  if (!Array.isArray(value)) return undefined;
  const out = [];
  const seen = new Set();
  for (const item of value) {
    const raw = item && typeof item.url === "string" ? item.url.trim() : "";
    if (!raw || raw.length > 2000) continue;
    let url;
    try {
      url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    const href = url.toString();
    if (seen.has(href)) continue;
    seen.add(href);
    const label = typeof item.label === "string" && item.label.trim() ? item.label.trim().slice(0, 120) : url.hostname;
    out.push({ label, url: href });
    if (out.length === MAX_LINKS) break;
  }
  return out;
}

/** "Q1/2026" … "Q4/2099", ou vazio. */
export const QUARTER_RE = /^Q[1-4]\/20\d{2}$/;
