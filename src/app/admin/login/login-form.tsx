"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") === "not-authorized" ? "This account is not an active administrator." : "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.replace(searchParams.get("next") || "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mt-6 grid gap-4 p-6">
      <label className="grid gap-2 text-sm font-semibold">
        Email
        <input className="rounded-lg border border-[var(--border)] bg-white px-3 py-3 font-normal" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Password
        <input className="rounded-lg border border-[var(--border)] bg-white px-3 py-3 font-normal" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className="btn-primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
