import { createClient } from "@/lib/supabase/server";

async function count(table: "products" | "projects" | "inquiries") {
  const supabase = await createClient();
  const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export default async function AdminDashboardPage() {
  const [products, projects, inquiries] = await Promise.all([
    count("products"),
    count("projects"),
    count("inquiries"),
  ]);

  return (
    <>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-[var(--muted)]">Phase 1/2 foundation is connected to the core database.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[["Products", products], ["Projects", projects], ["Inquiries", inquiries]].map(([label, value]) => (
          <div key={String(label)} className="card p-6">
            <p className="text-sm text-[var(--muted)]">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>
    </>
  );
}
