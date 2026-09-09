import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET;

function sign(encodedPayload) {
  if (!SECRET) throw new Error("SESSION_SECRET ist nicht gesetzt.");
  return crypto.createHmac("sha256", SECRET).update(encodedPayload).digest("base64url");
}

// Handgerolltes, HMAC-signiertes Token statt einer JWT-Library — 1:1
// übernommen aus stl-inside/lib/session.js (gleiche Präferenz für minimale
// Dependencies). Genutzt sowohl für den Magic-Link (kurze TTL) als auch das
// Session-Cookie (lange TTL) — gleicher Mechanismus, unterschiedliche
// TTL/Payload.
export function createToken(data, ttlSeconds) {
  const payload = JSON.stringify({ ...data, exp: Date.now() + ttlSeconds * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const expected = sign(encoded);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  const data = JSON.parse(Buffer.from(encoded, "base64url").toString());
  if (data.exp < Date.now()) return null;
  return data;
}
