import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/session";

// Next.js 16: middleware.ts wurde zu proxy.ts umbenannt (läuft standardmäßig
// auf Node.js-Runtime statt Edge — wichtig, da lib/session.js Node's
// crypto-Modul nutzt). Gleiches Muster wie stl-inside/proxy.ts.
//
// /api/render ist bewusst NICHT im Matcher — das ist ein Server-zu-Server-
// Endpunkt für n8n, kein von Menschen aufgerufener Bereich. Ein Browser-
// Session-Cookie kann n8n naturgemäß nicht mitschicken; die Route schützt
// sich stattdessen selbst über einen API-Key-Header (siehe
// app/api/render/route.ts).
export function proxy(request: NextRequest) {
  // Lokal (next dev) kein Login nötig, damit man die App direkt testen
  // kann — greift nur, wenn DEV_BYPASS_AUTH gesetzt ist, sonst bleibt das
  // normale Login-Gate aktiv. Gleiches Muster wie stl-inside/proxy.ts.
  if (process.env.NODE_ENV !== "production" && process.env.DEV_BYPASS_AUTH) {
    return NextResponse.next();
  }

  const session = verifyToken(request.cookies.get("session")?.value);
  if (!session?.email) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/templates/:path*", "/components/:path*"],
};
