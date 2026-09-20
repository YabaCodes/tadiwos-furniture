import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CatalogProduct = {
  id: string;
  name_en: string;
  slug: string;
  category_name: string | null;
  price_label: string;
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

  const products = (data ?? []).map((row: any) => ({
    id: row.id,
    name_en: row.name_en,
    slug: row.slug,
    category_name: Array.isArray(row.categories) ? row.categories[0]?.name_en ?? null : row.categories?.name_en ?? null,
    price_label: formatPrice(row.price_mode, row.price),
  }));

  return { configured: true, products };
}
