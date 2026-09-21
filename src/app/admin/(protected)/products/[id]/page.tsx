import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "../product-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [productResult, categoriesResult, variantsResult, imagesResult] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id,name_en").eq("active", true).order("sort_order", { ascending: true }),
    supabase.from("product_variants").select("*").eq("product_id", id).order("sort_order", { ascending: true }),
    supabase.from("product_images").select("id,storage_path,is_cover,variant_id,alt_text_en").eq("product_id", id).order("sort_order", { ascending: true }),
  ]);

  if (productResult.error) throw new Error(`Unable to load product: ${productResult.error.message}`);
  if (!productResult.data) notFound();
  if (categoriesResult.error) throw new Error(`Unable to load categories: ${categoriesResult.error.message}`);
  if (variantsResult.error) throw new Error(`Unable to load variants: ${variantsResult.error.message}`);
  if (imagesResult.error) throw new Error(`Unable to load product images: ${imagesResult.error.message}`);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.12em] text-[var(--forest)]">Products</p>
          <h1 className="mt-1 text-3xl font-bold">Edit {productResult.data.name_en}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {productResult.data.status === "published" ? <Link href={`/product/${productResult.data.slug}`} className="btn-secondary">View public page</Link> : null}
          <Link href="/admin/products" className="btn-secondary">Back to products</Link>
        </div>
      </div>
      <ProductForm
        categories={categoriesResult.data ?? []}
        initialProduct={{
          ...productResult.data,
          variants: variantsResult.data ?? [],
          images: imagesResult.data ?? [],
        }}
      />
    </>
  );
}
