import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminLoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="container-shell max-w-lg py-16">
      <p className="text-sm font-bold uppercase tracking-[.14em] text-[var(--forest)]">
        Administration
      </p>

      <h1 className="mt-2 text-3xl font-bold">Tadiwos Admin</h1>

      {!configured ? (
        <div className="card mt-6 p-6">
          <p className="font-semibold">Supabase is not configured.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Copy .env.example to .env.local and add the project credentials first.
          </p>
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="card mt-6 p-6 text-[var(--muted)]">
              Loading sign-in…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      )}
    </main>
  );
}