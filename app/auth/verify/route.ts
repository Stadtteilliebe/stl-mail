import { NextRequest, NextResponse } from "next/server";
import { verifyToken, createToken } from "../../../lib/session";

// Bewusst kurz gehalten (statt z.B. 30 Tage), um das Risiko ungebetener
// Logins über ein liegengelassenes/gestohlenes Gerät zu begrenzen — gleiche
// TTL wie stl-inside/app/auth/verify/route.ts.
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const data = verifyToken(token);

  if (!data?.email) {
    return NextResponse.redirect(new URL("/login?error=expired", request.url));
  }

  const session = createToken({ email: data.email }, SESSION_TTL_SECONDS);
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
  return response;
}
