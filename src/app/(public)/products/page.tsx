import Link from "next/link";
import { getPublishedCatalog } from "@/lib/data/catalog";

export default async function ProductsPage() {
  const catalog = await getPublishedCatalog();

  return (
    <main className="container-shell py-14">
      <p className="text-sm font-bold uppercase tracking-[.14em] text-[var(--forest)]">Catalog</p>
      <h1 className="mt-2 text-4xl font-bold">Our Furniture</h1>
      <p className="mt-4 max-w-2xl text-[var(--muted)]">
        Browse standard, configurable and made-to-measure furniture.
      </p>

      {!catalog.configured ? (
        <div className="card mt-10 p-6">
          <p className="font-semibold">Supabase is not connected yet.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Add the environment variables in .env.local and apply the database migration.</p>
        </div>
      ) : catalog.products.length === 0 ? (
        <div className="card mt-10 p-6">
          <p className="font-semibold">Catalog ready.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">No published products yet. Add the first product from the admin portal.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.products.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="card overflow-hidden transition-transform hover:-translate-y-0.5">
              {product.cover_url ? (
                <img src={product.cover_url} alt={product.name_en} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-[#eadfce] text-sm text-[var(--muted)]">Photo coming soon</div>
              )}
              <div className="p-5">
                <p className="text-xs uppercase tracking-[.12em] text-[var(--muted)]">{product.category_name ?? "Furniture"}</p>
                <h2 className="mt-2 text-xl font-semibold">{product.name_en}</h2>
                <p className="mt-3 text-sm font-semibold text-[var(--walnut)]">{product.price_label}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
