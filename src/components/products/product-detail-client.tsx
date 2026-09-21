"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { publicStorageUrl } from "@/lib/supabase/storage";
import type { PriceMode, ServiceStatus } from "@/types/domain";

type Spec = { key: string; value: string };

type ProductImage = {
  id: string;
  storage_path: string;
  alt_text_en: string | null;
  is_cover: boolean;
  variant_id: string | null;
};

type ProductVariant = {
  id: string;
  name_en: string;
  price_mode: PriceMode;
  price: number | null;
  width: number | null;
  height: number | null;
  depth: number | null;
  dimension_unit: string;
  specifications: unknown;
  is_default: boolean;
  active: boolean;
};

type Product = {
  id: string;
  name_en: string;
  description_en: string | null;
  reference_code: string;
  price_mode: PriceMode;
  price: number | null;
  price_custom_text_en: string | null;
  specifications: unknown;
  customization_options: unknown;
  customizable: boolean;
  made_to_order: boolean;
  delivery_status: ServiceStatus;
  installation_status: ServiceStatus;
  category_name: string | null;
};

function normalizeSpecs(value: unknown): Spec[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        key: typeof row.key === "string" ? row.key : "",
        value: typeof row.value === "string" ? row.value : "",
      };
    })
    .filter((row) => row.key || row.value);
}

function normalizeOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function formatPrice(mode: PriceMode, price: number | null, customText?: string | null) {
  if (mode === "quote_only") return "Request a quote";
  if (mode === "custom") return customText || "Contact for pricing";
  if (mode === "variant" && price == null) return "Select an option";
  if (price == null) return "Contact for pricing";
  const amount = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(price);
  if (mode === "starting_from") return `From ETB ${amount}`;
  if (mode === "per_meter") return `ETB ${amount} / meter`;
  if (mode === "per_square_meter") return `ETB ${amount} / m²`;
  if (mode === "per_piece") return `ETB ${amount} / piece`;
  return `ETB ${amount}`;
}

function serviceLabel(status: ServiceStatus) {
  if (status === "included") return "Included";
  if (status === "not_included") return "Not included";
  return "Depends on order";
}

export default function ProductDetailClient({
  product,
  variants,
  images,
  whatsapp,
}: {
  product: Product;
  variants: ProductVariant[];
  images: ProductImage[];
  whatsapp: string | null;
}) {
  const activeVariants = useMemo(() => variants.filter((variant) => variant.active), [variants]);
  const defaultVariant = activeVariants.find((variant) => variant.is_default) ?? activeVariants[0] ?? null;
  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? "");
  const selectedVariant = activeVariants.find((variant) => variant.id === selectedId) ?? defaultVariant;

  const parentImages = images.filter((image) => !image.variant_id);
  const variantImages = selectedVariant ? images.filter((image) => image.variant_id === selectedVariant.id) : [];
  const visibleImages = variantImages.length ? variantImages : parentImages;
  const sortedImages = [...visibleImages].sort((a, b) => Number(b.is_cover) - Number(a.is_cover));
  const [activeImageId, setActiveImageId] = useState(sortedImages[0]?.id ?? "");
  const effectiveActiveImage = sortedImages.find((image) => image.id === activeImageId) ?? sortedImages[0] ?? null;

  const productSpecs = normalizeSpecs(product.specifications);
  const variantSpecs = normalizeSpecs(selectedVariant?.specifications);
  const combinedSpecs = useMemo(() => {
    const map = new Map<string, string>();
    productSpecs.forEach((row) => map.set(row.key, row.value));
    variantSpecs.forEach((row) => map.set(row.key, row.value));
    return Array.from(map, ([key, value]) => ({ key, value }));
  }, [productSpecs, variantSpecs]);

  const customizationOptions = normalizeOptions(product.customization_options);
  const effectiveMode = selectedVariant?.price_mode ?? product.price_mode;
  const effectivePrice = selectedVariant?.price ?? product.price;
  const priceLabel = formatPrice(effectiveMode, effectivePrice, product.price_custom_text_en);

  const quoteHref = selectedVariant
    ? `/quote?product=${encodeURIComponent(product.id)}&variant=${encodeURIComponent(selectedVariant.id)}`
    : `/quote?product=${encodeURIComponent(product.id)}`;

  const whatsappDigits = whatsapp?.replace(/\D/g, "") ?? "";
  const whatsappMessage = selectedVariant
    ? `Hello, I am interested in ${product.name_en} — ${selectedVariant.name_en} (${product.reference_code}).`
    : `Hello, I am interested in ${product.name_en} (${product.reference_code}).`;
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  function chooseVariant(id: string) {
    setSelectedId(id);
    const nextImages = images.filter((image) => image.variant_id === id);
    const fallback = nextImages.length ? nextImages : parentImages;
    const first = [...fallback].sort((a, b) => Number(b.is_cover) - Number(a.is_cover))[0];
    setActiveImageId(first?.id ?? "");
  }

  return (
    <main className="container-shell py-12">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#eee5d8]">
            {effectiveActiveImage ? (
              <img
                src={publicStorageUrl("product-images", effectiveActiveImage.storage_path) ?? ""}
                alt={effectiveActiveImage.alt_text_en ?? product.name_en}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-[var(--muted)]">Product photo coming soon</div>
            )}
          </div>
          {sortedImages.length > 1 ? (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {sortedImages.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImageId(image.id)}
                  className={`overflow-hidden rounded-xl border ${effectiveActiveImage?.id === image.id ? "border-[var(--walnut)]" : "border-[var(--border)]"}`}
                >
                  <img src={publicStorageUrl("product-images", image.storage_path) ?? ""} alt={image.alt_text_en ?? product.name_en} className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[.13em] text-[var(--forest)]">{product.category_name ?? "Furniture"}</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">{product.name_en}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Reference {product.reference_code}</p>

          {activeVariants.length ? (
            <div className="mt-7">
              <p className="text-sm font-bold">Choose option</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeVariants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => chooseVariant(variant.id)}
                    className={`min-h-11 rounded-xl border px-4 font-semibold ${selectedVariant?.id === variant.id ? "border-[var(--walnut)] bg-[var(--walnut)] text-white" : "border-[var(--border)] bg-white"}`}
                  >
                    {variant.name_en}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-7 text-2xl font-bold text-[var(--walnut)]">{priceLabel}</p>
          {product.description_en ? <p className="mt-5 leading-7 text-[var(--muted)]">{product.description_en}</p> : null}

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={quoteHref} className="btn-primary">Request a Quote</Link>
            {whatsappHref ? <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn-secondary">WhatsApp</a> : null}
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-5 text-sm sm:grid-cols-2">
            <div><span className="text-[var(--muted)]">Made to order</span><p className="font-semibold">{product.made_to_order ? "Yes" : "No"}</p></div>
            <div><span className="text-[var(--muted)]">Customization</span><p className="font-semibold">{product.customizable ? "Available" : "Not listed"}</p></div>
            <div><span className="text-[var(--muted)]">Delivery</span><p className="font-semibold">{serviceLabel(product.delivery_status)}</p></div>
            <div><span className="text-[var(--muted)]">Installation</span><p className="font-semibold">{serviceLabel(product.installation_status)}</p></div>
          </div>
        </div>
      </div>

      {combinedSpecs.length ? (
        <section className="mt-14">
          <h2 className="text-2xl font-bold">Specifications</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
            {combinedSpecs.map((row) => (
              <div key={row.key} className="grid grid-cols-[.9fr_1.1fr] gap-4 border-b border-[var(--border)] px-5 py-4 last:border-b-0">
                <span className="font-semibold">{row.key}</span><span className="text-[var(--muted)]">{row.value}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {selectedVariant && (selectedVariant.width != null || selectedVariant.height != null || selectedVariant.depth != null) ? (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">Dimensions</h2>
          <p className="mt-3 text-[var(--muted)]">
            {[selectedVariant.width != null ? `W ${selectedVariant.width}` : null, selectedVariant.height != null ? `H ${selectedVariant.height}` : null, selectedVariant.depth != null ? `D ${selectedVariant.depth}` : null].filter(Boolean).join(" × ")} {selectedVariant.dimension_unit}
          </p>
        </section>
      ) : null}

      {customizationOptions.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">Customization available</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {customizationOptions.map((option) => <div key={option} className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">✓ {option}</div>)}
          </div>
        </section>
      ) : null}
    </main>
  );
}
