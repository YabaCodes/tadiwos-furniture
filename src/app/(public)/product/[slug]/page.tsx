import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/products/product-detail-client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("id,name_en,description_en,reference_code,price_mode,price,price_custom_text_en,specifications,customization_options,customizable,made_to_order,delivery_status,installation_status,categories(name_en)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(`Unable to load product: ${error.message}`);
  if (!product) notFound();

  const [variantsResult, imagesResult, settingsResult] = await Promise.all([
    supabase.from("product_variants").select("id,name_en,price_mode,price,width,height,depth,dimension_unit,specifications,is_default,active").eq("product_id", product.id).eq("active", true).order("sort_order", { ascending: true }),
    supabase.from("product_images").select("id,storage_path,alt_text_en,is_cover,variant_id").eq("product_id", product.id).order("sort_order", { ascending: true }),
    supabase.from("site_settings").select("whatsapp").eq("id", 1).maybeSingle(),
  ]);

  if (variantsResult.error) throw new Error(`Unable to load variants: ${variantsResult.error.message}`);
  if (imagesResult.error) throw new Error(`Unable to load images: ${imagesResult.error.message}`);

  const categoryName = Array.isArray(product.categories)
    ? product.categories[0]?.name_en ?? null
    : (product.categories as { name_en?: string } | null)?.name_en ?? null;

  return (
    <ProductDetailClient
      product={{ ...product, category_name: categoryName }}
      variants={variantsResult.data ?? []}
      images={imagesResult.data ?? []}
      whatsapp={settingsResult.data?.whatsapp ?? null}
    />
  );
}
