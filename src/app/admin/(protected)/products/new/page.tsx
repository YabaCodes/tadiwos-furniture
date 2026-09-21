import Link from "next/link";
import ProductForm from "../product-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id,name_en")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Unable to load categories: ${error.message}`);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.12em] text-[var(--forest)]">Products</p>
          <h1 className="mt-1 text-3xl font-bold">Add product</h1>
        </div>
        <Link href="/admin/products" className="btn-secondary">Back to products</Link>
      </div>
      <ProductForm categories={categories ?? []} />
    </>
  );
}
