// Bewusst einfacher In-Memory-Limiter statt Redis/Upstash — 1:1 übernommen
// aus stl-inside/lib/rate-limit.js. Wichtige Einschränkung: gilt nur pro
// Server-Instanz, auf Vercel also "pro Instanz" statt hartes globales
// Limit — für den Zweck hier (Spam/Missbrauch des Magic-Link-Versands
// erschweren, nicht kryptographisch ausschließen) reicht das.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const hits = new Map();

export function isRateLimited(key) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_HITS;
}
