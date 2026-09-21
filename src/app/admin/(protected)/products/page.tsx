import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function priceLabel(mode: string, price: number | null) {
  if (mode === "variant") return "Variant pricing";
  if (mode === "quote_only") return "Quote only";
  if (mode === "custom") return "Custom pricing";
  if (price == null) return "—";
  const amount = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(price);
  if (mode === "starting_from") return `From ETB ${amount}`;
  if (mode === "per_meter") return `ETB ${amount} / m`;
  if (mode === "per_square_meter") return `ETB ${amount} / m²`;
  if (mode === "per_piece") return `ETB ${amount} / piece`;
  return `ETB ${amount}`;
}

export default async function ProductsAdminPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id,name_en,reference_code,product_type,price_mode,price,status,updated_at,categories(name_en)")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Unable to load products: ${error.message}`);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.12em] text-[var(--forest)]">Catalog management</p>
          <h1 className="mt-1 text-3xl font-bold">Products</h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary">+ Add Product</Link>
      </div>

      {(products ?? []).length === 0 ? (
        <div className="card mt-8 p-7">
          <h2 className="text-xl font-bold">No products yet</h2>
          <p className="mt-2 text-[var(--muted)]">Create the first product, add variants and photos, then publish it to the public catalog.</p>
          <Link href="/admin/products/new" className="btn-primary mt-5">Create first product</Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_.8fr_auto] gap-4 border-b border-[var(--border)] bg-[#f8f4ed] px-5 py-3 text-xs font-bold uppercase tracking-[.08em] text-[var(--muted)] md:grid">
            <span>Product</span><span>Category</span><span>Pricing</span><span>Status</span><span />
          </div>
          {(products ?? []).map((product: any) => {
            const category = Array.isArray(product.categories) ? product.categories[0]?.name_en : product.categories?.name_en;
            return (
              <div key={product.id} className="grid gap-3 border-b border-[var(--border)] px-5 py-4 last:border-b-0 md:grid-cols-[1.5fr_1fr_1fr_.8fr_auto] md:items-center md:gap-4">
                <div>
                  <p className="font-bold">{product.name_en}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{product.reference_code} · {product.product_type.replaceAll("_", " ")}</p>
                </div>
                <p className="text-sm">{category ?? "—"}</p>
                <p className="text-sm">{priceLabel(product.price_mode, product.price)}</p>
                <span className="w-fit rounded-full bg-[#eee7da] px-2.5 py-1 text-xs font-semibold capitalize">{product.status}</span>
                <Link href={`/admin/products/${product.id}`} className="text-sm font-bold text-[var(--walnut)]">Edit</Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
