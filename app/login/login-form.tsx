"use client";

import { useActionState, useState } from "react";
import { requestMagicLink } from "./actions";

const initialState = { sent: false, error: null as string | null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(requestMagicLink, initialState);
  const [retry, setRetry] = useState(false);

  if (state.sent && !retry) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Falls die Adresse eine @stadtteilliebe.de-Adresse ist, hast du gleich eine E-Mail mit
          einem Login-Link.
        </p>
        <button
          type="button"
          onClick={() => setRetry(true)}
          className="self-start text-sm text-zinc-500 underline transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Andere Adresse verwenden
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        setRetry(false);
        await formAction(formData);
      }}
      className="flex flex-col gap-3"
    >
      <input
        type="email"
        name="email"
        required
        placeholder="deine@stadtteilliebe.de"
        className="rounded border border-black/[.08] px-3 py-2 text-sm outline-none transition-colors focus:border-black/30 dark:border-white/[.145] dark:bg-zinc-900 dark:focus:border-white/30"
      />
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-30 dark:bg-white dark:text-black"
      >
        {pending ? "Wird gesendet…" : "Login-Link senden"}
      </button>
    </form>
  );
}
