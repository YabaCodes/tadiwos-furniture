import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/supabase/storage";

export type CatalogProduct = {
  id: string;
  name_en: string;
  slug: string;
  category_name: string | null;
  price_label: string;
  cover_url: string | null;
};

function formatPrice(mode: string, price: number | null) {
  if (mode === "quote_only") return "Request a quote";
  if (mode === "variant") return "View sizes & prices";
  if (mode === "custom") return "Contact for pricing";
  if (price == null) return "Contact for pricing";

  const value = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(price);
  if (mode === "starting_from") return `From ETB ${value}`;
  if (mode === "per_meter") return `ETB ${value} / meter`;
  if (mode === "per_square_meter") return `ETB ${value} / m²`;
  if (mode === "per_piece") return `ETB ${value} / piece`;
  return `ETB ${value}`;
}

export async function getPublishedCatalog(): Promise<{ configured: boolean; products: CatalogProduct[] }> {
  if (!isSupabaseConfigured()) return { configured: false, products: [] };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name_en,slug,price_mode,price,categories(name_en)")
    .eq("status", "published")
    .eq("accepting_orders", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to load catalog: ${error.message}`);

  const ids = (data ?? []).map((row: any) => row.id);
  let images: any[] = [];
  if (ids.length) {
    const imageResult = await supabase
      .from("product_images")
      .select("product_id,storage_path,is_cover,sort_order,variant_id")
      .in("product_id", ids)
      .is("variant_id", null)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });
    if (imageResult.error) throw new Error(`Unable to load catalog images: ${imageResult.error.message}`);
    images = imageResult.data ?? [];
  }

  const products = (data ?? []).map((row: any) => {
    const image = images.find((item) => item.product_id === row.id) ?? null;
    return {
      id: row.id,
      name_en: row.name_en,
      slug: row.slug,
      category_name: Array.isArray(row.categories) ? row.categories[0]?.name_en ?? null : row.categories?.name_en ?? null,
      price_label: formatPrice(row.price_mode, row.price),
      cover_url: image ? publicStorageUrl("product-images", image.storage_path) : null,
    };
  });

  return { configured: true, products };
}
