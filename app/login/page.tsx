import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 min-h-screen">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-sm font-semibold tracking-tight">stl mail</span>
        </div>
        <div className="rounded-lg border border-black/[.08] p-6 dark:border-white/[.145]">
          <h1 className="text-lg font-semibold tracking-tight mb-1">Login</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Gib deine @stadtteilliebe.de-Adresse ein — wir schicken dir einen Login-Link.
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
