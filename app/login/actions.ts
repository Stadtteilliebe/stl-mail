"use server";

import { headers } from "next/headers";
import { createToken } from "../../lib/session";
import { isRateLimited } from "../../lib/rate-limit";

const MAGIC_LINK_TTL_SECONDS = 15 * 60;
const ALLOWED_DOMAIN = "stadtteilliebe.de";

export async function requestMagicLink(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { sent: false, error: "Bitte eine E-Mail-Adresse eingeben." };

  // Zwei Schlüssel: IP begrenzt "viele verschiedene Adressen durchprobieren",
  // E-Mail begrenzt "eine Adresse mit Mails zuspammen" — gleiches Muster
  // wie stl-inside/app/login/actions.ts.
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimited = isRateLimited(`ip:${ip}`) || isRateLimited(`email:${email.toLowerCase()}`);

  // Kein Notion-Lookup nötig wie bei stl-inside (keine Contacts-DB hier) —
  // Zugriff ist an die Firmendomain gebunden, nicht an einzelne Personen.
  const allowed = !rateLimited && email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);

  // Immer die gleiche Antwort, egal ob die Domain passt oder das Limit
  // greift — verhindert, dass sich über die Login-Seite abfragen lässt,
  // welche Adressen erlaubt sind oder ob gerade limitiert wird.
  if (allowed) {
    const token = createToken({ email: email.toLowerCase() }, MAGIC_LINK_TTL_SECONDS);
    const link = `${process.env.MAIL_BASE_URL}/auth/verify?token=${token}`;

    const webhookUrl = process.env.N8N_MAIL_MAGIC_LINK_WEBHOOK_URL;
    if (!webhookUrl) throw new Error("N8N_MAIL_MAGIC_LINK_WEBHOOK_URL ist nicht gesetzt.");
    // fetch() wirft nur bei Netzwerkfehlern, nicht bei HTTP-Fehlerstatus —
    // ohne diesen Check würde ein 4xx/5xx von n8n unbemerkt bleiben.
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, link }),
    });
    if (!res.ok) console.error(`Magic-Link-Mail: n8n antwortete mit Status ${res.status}.`);
  }

  return { sent: true, error: null };
}
