import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="container-shell py-12">
        <div className="card p-6">
          <h1 className="text-2xl font-bold">Admin setup required</h1>
          <p className="mt-3 text-[var(--muted)]">Connect Supabase using .env.local, then create and activate the first admin profile.</p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role,active")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.active) redirect("/admin/login?error=not-authorized");

  return (
    <div className="min-h-screen bg-[#f3efe7]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="container-shell flex min-h-16 items-center justify-between gap-6">
          <Link href="/admin" className="font-bold text-[var(--walnut)]">Tadiwos Admin</Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin/products">Products</Link>
            <Link href="/admin/projects">Projects</Link>
            <Link href="/admin/inquiries">Inquiries</Link>
            <Link href="/admin/settings">Settings</Link>
            <Link href="/">View site</Link>
          </nav>
        </div>
      </header>
      <main className="container-shell py-10">{children}</main>
    </div>
  );
}
