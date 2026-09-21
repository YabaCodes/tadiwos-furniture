"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { publicStorageUrl } from "@/lib/supabase/storage";
import type { PriceMode, ProductType, PublicationStatus, ServiceStatus } from "@/types/domain";

type Category = {
  id: string;
  name_en: string;
};

type Spec = {
  key: string;
  value: string;
};

type ExistingImage = {
  id: string;
  storage_path: string;
  is_cover: boolean;
  variant_id: string | null;
  alt_text_en?: string | null;
};

type InitialVariant = {
  id: string;
  name_en: string;
  name_am: string | null;
  reference_code: string | null;
  price_mode: PriceMode;
  price: number | null;
  width: number | null;
  height: number | null;
  depth: number | null;
  dimension_unit: string;
  description_en: string | null;
  description_am: string | null;
  specifications: unknown;
  sort_order: number;
  is_default: boolean;
  active: boolean;
};

type InitialProduct = {
  id: string;
  category_id: string;
  name_en: string;
  name_am: string | null;
  slug: string;
  reference_code: string;
  description_en: string | null;
  description_am: string | null;
  product_type: ProductType;
  has_variants: boolean;
  price_mode: PriceMode;
  price: number | null;
  currency_code: string;
  price_custom_text_en: string | null;
  price_custom_text_am: string | null;
  made_to_order: boolean;
  customizable: boolean;
  customization_options: unknown;
  specifications: unknown;
  delivery_status: ServiceStatus;
  installation_status: ServiceStatus;
  featured: boolean;
  accepting_orders: boolean;
  status: PublicationStatus;
  variants: InitialVariant[];
  images: ExistingImage[];
};

type VariantDraft = {
  localKey: string;
  id?: string;
  name_en: string;
  name_am: string;
  reference_code: string;
  price_mode: Exclude<PriceMode, "variant">;
  price: string;
  width: string;
  height: string;
  depth: string;
  dimension_unit: string;
  description_en: string;
  description_am: string;
  specifications: Spec[];
  sort_order: number;
  is_default: boolean;
  active: boolean;
  existingImages: ExistingImage[];
  newFiles: File[];
};

type DeletedImage = {
  id: string;
  storage_path: string;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 outline-none focus:border-[var(--walnut)]";
const labelClass = "block text-sm font-semibold text-[var(--foreground)]";

const priceModes: { value: PriceMode; label: string }[] = [
  { value: "fixed", label: "Fixed price" },
  { value: "starting_from", label: "Starting from" },
  { value: "variant", label: "Variant pricing" },
  { value: "per_meter", label: "Per meter" },
  { value: "per_square_meter", label: "Per square meter" },
  { value: "per_piece", label: "Per piece" },
  { value: "quote_only", label: "Quote only" },
  { value: "custom", label: "Custom text" },
];

const variantPriceModes = priceModes.filter((mode) => mode.value !== "variant") as {
  value: Exclude<PriceMode, "variant">;
  label: string;
}[];

const customizationChoices = [
  "Custom dimensions",
  "Different finish / color",
  "Material options",
  "Design modifications",
];

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

function normalizeCustomizationOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toNumberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function requiresPrice(mode: PriceMode) {
  return !["variant", "quote_only", "custom"].includes(mode);
}

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

function makeVariantDraft(index: number): VariantDraft {
  return {
    localKey: `new-${Date.now()}-${index}`,
    name_en: "",
    name_am: "",
    reference_code: "",
    price_mode: "fixed",
    price: "",
    width: "",
    height: "",
    depth: "",
    dimension_unit: "cm",
    description_en: "",
    description_am: "",
    specifications: [],
    sort_order: index,
    is_default: index === 0,
    active: true,
    existingImages: [],
    newFiles: [],
  };
}

export default function ProductForm({
  categories,
  initialProduct,
}: {
  categories: Category[];
  initialProduct?: InitialProduct;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [nameEn, setNameEn] = useState(initialProduct?.name_en ?? "");
  const [nameAm, setNameAm] = useState(initialProduct?.name_am ?? "");
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [referenceCode, setReferenceCode] = useState(initialProduct?.reference_code ?? "");
  const [categoryId, setCategoryId] = useState(initialProduct?.category_id ?? categories[0]?.id ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initialProduct?.description_en ?? "");
  const [descriptionAm, setDescriptionAm] = useState(initialProduct?.description_am ?? "");
  const [productType, setProductType] = useState<ProductType>(initialProduct?.product_type ?? "standard");
  const [priceMode, setPriceMode] = useState<PriceMode>(initialProduct?.price_mode ?? "fixed");
  const [price, setPrice] = useState(initialProduct?.price != null ? String(initialProduct.price) : "");
  const [priceCustomTextEn, setPriceCustomTextEn] = useState(initialProduct?.price_custom_text_en ?? "");
  const [priceCustomTextAm, setPriceCustomTextAm] = useState(initialProduct?.price_custom_text_am ?? "");
  const [madeToOrder, setMadeToOrder] = useState(initialProduct?.made_to_order ?? true);
  const [customizable, setCustomizable] = useState(initialProduct?.customizable ?? true);
  const [customizationOptions, setCustomizationOptions] = useState<string[]>(
    normalizeCustomizationOptions(initialProduct?.customization_options),
  );
  const [specifications, setSpecifications] = useState<Spec[]>(normalizeSpecs(initialProduct?.specifications));
  const [deliveryStatus, setDeliveryStatus] = useState<ServiceStatus>(initialProduct?.delivery_status ?? "included");
  const [installationStatus, setInstallationStatus] = useState<ServiceStatus>(initialProduct?.installation_status ?? "included");
  const [featured, setFeatured] = useState(initialProduct?.featured ?? false);
  const [acceptingOrders, setAcceptingOrders] = useState(initialProduct?.accepting_orders ?? true);
  const [status, setStatus] = useState<PublicationStatus>(initialProduct?.status ?? "draft");
  const [parentExistingImages, setParentExistingImages] = useState<ExistingImage[]>(
    initialProduct?.images.filter((image) => !image.variant_id) ?? [],
  );
  const [parentNewFiles, setParentNewFiles] = useState<File[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>(
    initialProduct?.variants.map((variant, index) => ({
      localKey: variant.id,
      id: variant.id,
      name_en: variant.name_en,
      name_am: variant.name_am ?? "",
      reference_code: variant.reference_code ?? "",
      price_mode: variant.price_mode === "variant" ? "fixed" : variant.price_mode,
      price: variant.price != null ? String(variant.price) : "",
      width: variant.width != null ? String(variant.width) : "",
      height: variant.height != null ? String(variant.height) : "",
      depth: variant.depth != null ? String(variant.depth) : "",
      dimension_unit: variant.dimension_unit,
      description_en: variant.description_en ?? "",
      description_am: variant.description_am ?? "",
      specifications: normalizeSpecs(variant.specifications),
      sort_order: variant.sort_order ?? index,
      is_default: variant.is_default,
      active: variant.active,
      existingImages: initialProduct.images.filter((image) => image.variant_id === variant.id),
      newFiles: [],
    })) ?? [],
  );
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<DeletedImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function autoSlug() {
    if (slug.trim() || !nameEn.trim()) return;
    setSlug(
      nameEn
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );
  }

  function updateSpec(index: number, field: keyof Spec, value: string) {
    setSpecifications((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  }

  function updateVariant(localKey: string, patch: Partial<VariantDraft>) {
    setVariants((rows) => rows.map((variant) => (variant.localKey === localKey ? { ...variant, ...patch } : variant)));
  }

  function updateVariantSpec(localKey: string, index: number, field: keyof Spec, value: string) {
    setVariants((rows) =>
      rows.map((variant) =>
        variant.localKey === localKey
          ? {
              ...variant,
              specifications: variant.specifications.map((row, rowIndex) =>
                rowIndex === index ? { ...row, [field]: value } : row,
              ),
            }
          : variant,
      ),
    );
  }

  function removeParentImage(image: ExistingImage) {
    setParentExistingImages((rows) => rows.filter((row) => row.id !== image.id));
    setDeletedImages((rows) => [...rows, { id: image.id, storage_path: image.storage_path }]);
  }

  function removeVariantImage(localKey: string, image: ExistingImage) {
    setVariants((rows) =>
      rows.map((variant) =>
        variant.localKey === localKey
          ? { ...variant, existingImages: variant.existingImages.filter((row) => row.id !== image.id) }
          : variant,
      ),
    );
    setDeletedImages((rows) => [...rows, { id: image.id, storage_path: image.storage_path }]);
  }

  function removeVariant(localKey: string) {
    const variant = variants.find((row) => row.localKey === localKey);
    if (!variant) return;

    if (variant.id) setDeletedVariantIds((rows) => [...rows, variant.id!]);
    if (variant.existingImages.length) {
      setDeletedImages((rows) => [
        ...rows,
        ...variant.existingImages.map((image) => ({ id: image.id, storage_path: image.storage_path })),
      ]);
    }

    const remaining = variants.filter((row) => row.localKey !== localKey);
    if (variant.is_default && remaining.length) remaining[0] = { ...remaining[0], is_default: true };
    setVariants(remaining);
  }

  async function uploadFiles(productId: string, variantId: string | null, files: File[], existingHasCover: boolean) {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const folder = variantId ? `variants/${variantId}` : "product";
      const path = `${productId}/${folder}/${crypto.randomUUID()}-${safeFileName(file.name) || "image"}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: imageError } = await supabase.from("product_images").insert({
        product_id: productId,
        variant_id: variantId,
        storage_path: path,
        alt_text_en: nameEn || null,
        sort_order: index,
        is_cover: !existingHasCover && index === 0,
      });
      if (imageError) throw imageError;
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (!nameEn.trim() || !slug.trim() || !referenceCode.trim() || !categoryId) {
      setMessage("English name, slug, reference code and category are required.");
      return;
    }
    if (requiresPrice(priceMode) && toNumberOrNull(price) == null) {
      setMessage("Enter a valid price for the selected pricing mode.");
      return;
    }
    if (priceMode === "variant" && variants.length === 0) {
      setMessage("Variant pricing requires at least one variant.");
      return;
    }
    for (const variant of variants) {
      if (!variant.name_en.trim()) {
        setMessage("Every variant needs an English name.");
        return;
      }
      if (requiresPrice(variant.price_mode) && toNumberOrNull(variant.price) == null) {
        setMessage(`Enter a valid price for variant ${variant.name_en || "(unnamed)"}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const productPayload = {
        category_id: categoryId,
        name_en: nameEn.trim(),
        name_am: nameAm.trim() || null,
        slug: slug.trim(),
        reference_code: referenceCode.trim().toUpperCase(),
        description_en: descriptionEn.trim() || null,
        description_am: descriptionAm.trim() || null,
        product_type: productType,
        has_variants: variants.length > 0,
        price_mode: priceMode,
        price: requiresPrice(priceMode) ? toNumberOrNull(price) : null,
        currency_code: "ETB",
        price_custom_text_en: priceCustomTextEn.trim() || null,
        price_custom_text_am: priceCustomTextAm.trim() || null,
        made_to_order: madeToOrder,
        customizable,
        customization_options: customizationOptions,
        specifications: specifications.filter((row) => row.key.trim() || row.value.trim()),
        delivery_status: deliveryStatus,
        installation_status: installationStatus,
        featured,
        accepting_orders: acceptingOrders,
        status,
      };

      let productId = initialProduct?.id;
      if (productId) {
        const { error } = await supabase.from("products").update(productPayload).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(productPayload).select("id").single();
        if (error) throw error;
        productId = data.id;
      }

      if (!productId) throw new Error("Product ID was not created.");

      if (deletedImages.length) {
        const { error } = await supabase.from("product_images").delete().in(
          "id",
          deletedImages.map((image) => image.id),
        );
        if (error) throw error;
        const { error: storageError } = await supabase.storage
          .from("product-images")
          .remove(deletedImages.map((image) => image.storage_path));
        if (storageError) throw storageError;
      }

      if (deletedVariantIds.length) {
        const { error } = await supabase.from("product_variants").delete().in("id", deletedVariantIds);
        if (error) throw error;
      }

      if (variants.length) {
        const { error } = await supabase.from("product_variants").update({ is_default: false }).eq("product_id", productId);
        if (error) throw error;
      }

      const variantIds = new Map<string, string>();
      for (let index = 0; index < variants.length; index += 1) {
        const variant = variants[index];
        const payload = {
          product_id: productId,
          name_en: variant.name_en.trim(),
          name_am: variant.name_am.trim() || null,
          reference_code: variant.reference_code.trim() || null,
          price_mode: variant.price_mode,
          price: requiresPrice(variant.price_mode) ? toNumberOrNull(variant.price) : null,
          currency_code: "ETB",
          width: toNumberOrNull(variant.width),
          height: toNumberOrNull(variant.height),
          depth: toNumberOrNull(variant.depth),
          dimension_unit: variant.dimension_unit || "cm",
          description_en: variant.description_en.trim() || null,
          description_am: variant.description_am.trim() || null,
          specifications: variant.specifications.filter((row) => row.key.trim() || row.value.trim()),
          sort_order: index,
          is_default: variant.is_default,
          active: variant.active,
        };

        if (variant.id) {
          const { error } = await supabase.from("product_variants").update(payload).eq("id", variant.id);
          if (error) throw error;
          variantIds.set(variant.localKey, variant.id);
        } else {
          const { data, error } = await supabase.from("product_variants").insert(payload).select("id").single();
          if (error) throw error;
          variantIds.set(variant.localKey, data.id);
        }
      }

      await uploadFiles(
        productId,
        null,
        parentNewFiles,
        parentExistingImages.some((image) => image.is_cover),
      );

      for (const variant of variants) {
        const variantId = variantIds.get(variant.localKey);
        if (!variantId || variant.newFiles.length === 0) continue;
        await uploadFiles(
          productId,
          variantId,
          variant.newFiles,
          variant.existingImages.some((image) => image.is_cover),
        );
      }

      setMessage("Product saved successfully.");
      if (initialProduct) {
      router.push(`/admin/products/${productId}?saved=1`);
      } else {
      router.push("/admin/products?created=1");
      }
      router.refresh();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unable to save product.";
      setMessage(detail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {message ? (
        <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm">{message}</div>
      ) : null}

      <section className="card p-6">
        <h2 className="text-xl font-bold">Basic information</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            English name *
            <input className={inputClass} value={nameEn} onChange={(e) => setNameEn(e.target.value)} onBlur={autoSlug} />
          </label>
          <label className={labelClass}>
            Amharic name
            <input className={inputClass} value={nameAm} onChange={(e) => setNameAm(e.target.value)} />
          </label>
          <label className={labelClass}>
            URL slug *
            <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="bed-b01" />
          </label>
          <label className={labelClass}>
            Reference code *
            <input className={inputClass} value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} placeholder="BED-B01" />
          </label>
          <label className={labelClass}>
            Category *
            <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Choose category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name_en}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Product type
            <select className={inputClass} value={productType} onChange={(e) => setProductType(e.target.value as ProductType)}>
              <option value="standard">Standard</option>
              <option value="configurable">Configurable</option>
              <option value="made_to_measure">Made to measure</option>
            </select>
          </label>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            English description
            <textarea className={`${inputClass} min-h-28`} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
          </label>
          <label className={labelClass}>
            Amharic description
            <textarea className={`${inputClass} min-h-28`} value={descriptionAm} onChange={(e) => setDescriptionAm(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-bold">Pricing</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            Pricing mode
            <select className={inputClass} value={priceMode} onChange={(e) => setPriceMode(e.target.value as PriceMode)}>
              {priceModes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
            </select>
          </label>
          {requiresPrice(priceMode) ? (
            <label className={labelClass}>
              Price (ETB)
              <input className={inputClass} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            </label>
          ) : null}
        </div>
        {priceMode === "custom" ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className={labelClass}>
              Custom price text — English
              <input className={inputClass} value={priceCustomTextEn} onChange={(e) => setPriceCustomTextEn(e.target.value)} placeholder="Price depends on design and material" />
            </label>
            <label className={labelClass}>
              Custom price text — Amharic
              <input className={inputClass} value={priceCustomTextAm} onChange={(e) => setPriceCustomTextAm(e.target.value)} />
            </label>
          </div>
        ) : null}
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Product photos</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">These are the default photos. Variants inherit them unless variant-specific photos are added.</p>
          </div>
          <label className="btn-secondary cursor-pointer">
            Add photos
            <input
              className="hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setParentNewFiles(Array.from(e.target.files ?? []))}
            />
          </label>
        </div>
        {parentExistingImages.length || parentNewFiles.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parentExistingImages.map((image) => (
              <div key={image.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
                {publicStorageUrl("product-images", image.storage_path) ? (
                  <img src={publicStorageUrl("product-images", image.storage_path)!} alt={image.alt_text_en ?? nameEn} className="aspect-[4/3] w-full object-cover" />
                ) : null}
                <div className="flex items-center justify-between gap-2 p-3 text-xs">
                  <span>{image.is_cover ? "Cover image" : "Saved image"}</span>
                  <button type="button" className="font-semibold text-red-700" onClick={() => removeParentImage(image)}>Remove</button>
                </div>
              </div>
            ))}
            {parentNewFiles.map((file) => (
              <div key={`${file.name}-${file.size}`} className="rounded-xl border border-dashed border-[var(--border)] bg-white p-4 text-sm">
                New: {file.name}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-[var(--muted)]">No photos added yet.</p>
        )}
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Variants</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Use variants for sizes such as 1.0 m, 1.2 m and 1.5 m.</p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const next = makeVariantDraft(variants.length);
              if (variants.length) next.is_default = false;
              setVariants((rows) => [...rows, next]);
              if (priceMode !== "variant") setPriceMode("variant");
              if (productType === "standard") setProductType("configurable");
            }}
          >
            + Add variant
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {variants.map((variant, index) => (
            <div key={variant.localKey} className="rounded-2xl border border-[var(--border)] bg-[#fbf8f2] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold">Variant {index + 1}{variant.name_en ? ` — ${variant.name_en}` : ""}</h3>
                <button type="button" className="text-sm font-semibold text-red-700" onClick={() => removeVariant(variant.localKey)}>Remove variant</button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className={labelClass}>English name *<input className={inputClass} value={variant.name_en} onChange={(e) => updateVariant(variant.localKey, { name_en: e.target.value })} placeholder="1.5 m" /></label>
                <label className={labelClass}>Amharic name<input className={inputClass} value={variant.name_am} onChange={(e) => updateVariant(variant.localKey, { name_am: e.target.value })} /></label>
                <label className={labelClass}>Reference code<input className={inputClass} value={variant.reference_code} onChange={(e) => updateVariant(variant.localKey, { reference_code: e.target.value })} placeholder="BED-B01-150" /></label>
                <label className={labelClass}>Price mode<select className={inputClass} value={variant.price_mode} onChange={(e) => updateVariant(variant.localKey, { price_mode: e.target.value as Exclude<PriceMode, "variant"> })}>{variantPriceModes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
                {requiresPrice(variant.price_mode) ? <label className={labelClass}>Price (ETB)<input className={inputClass} inputMode="decimal" value={variant.price} onChange={(e) => updateVariant(variant.localKey, { price: e.target.value })} /></label> : null}
                <label className={labelClass}>Width<input className={inputClass} inputMode="decimal" value={variant.width} onChange={(e) => updateVariant(variant.localKey, { width: e.target.value })} /></label>
                <label className={labelClass}>Height<input className={inputClass} inputMode="decimal" value={variant.height} onChange={(e) => updateVariant(variant.localKey, { height: e.target.value })} /></label>
                <label className={labelClass}>Depth<input className={inputClass} inputMode="decimal" value={variant.depth} onChange={(e) => updateVariant(variant.localKey, { depth: e.target.value })} /></label>
                <label className={labelClass}>Dimension unit<select className={inputClass} value={variant.dimension_unit} onChange={(e) => updateVariant(variant.localKey, { dimension_unit: e.target.value })}><option value="cm">cm</option><option value="m">m</option><option value="mm">mm</option></select></label>
              </div>

              <div className="mt-4 flex flex-wrap gap-5 text-sm">
                <label className="flex items-center gap-2"><input type="radio" name="default-variant" checked={variant.is_default} onChange={() => setVariants((rows) => rows.map((row) => ({ ...row, is_default: row.localKey === variant.localKey })))} /> Default variant</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={variant.active} onChange={(e) => updateVariant(variant.localKey, { active: e.target.checked })} /> Active</label>
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold">Variant-specific photos</h4>
                  <label className="cursor-pointer text-sm font-semibold text-[var(--walnut)]">Add photos<input className="hidden" type="file" accept="image/*" multiple onChange={(e) => updateVariant(variant.localKey, { newFiles: Array.from(e.target.files ?? []) })} /></label>
                </div>
                {variant.existingImages.length || variant.newFiles.length ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {variant.existingImages.map((image) => (
                      <div key={image.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
                        {publicStorageUrl("product-images", image.storage_path) ? <img src={publicStorageUrl("product-images", image.storage_path)!} alt={image.alt_text_en ?? variant.name_en} className="aspect-[4/3] w-full object-cover" /> : null}
                        <div className="flex items-center justify-between p-2 text-xs"><span>{image.is_cover ? "Cover" : "Saved"}</span><button type="button" className="font-semibold text-red-700" onClick={() => removeVariantImage(variant.localKey, image)}>Remove</button></div>
                      </div>
                    ))}
                    {variant.newFiles.map((file) => <div key={`${file.name}-${file.size}`} className="rounded-xl border border-dashed border-[var(--border)] bg-white p-3 text-xs">New: {file.name}</div>)}
                  </div>
                ) : <p className="mt-2 text-sm text-[var(--muted)]">No variant-specific photos. Parent product photos will be used.</p>}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3"><h4 className="font-semibold">Variant specifications</h4><button type="button" className="text-sm font-semibold text-[var(--walnut)]" onClick={() => updateVariant(variant.localKey, { specifications: [...variant.specifications, { key: "", value: "" }] })}>+ Add specification</button></div>
                <div className="mt-3 space-y-2">
                  {variant.specifications.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input className={inputClass.replace("mt-1 ", "")} value={row.key} onChange={(e) => updateVariantSpec(variant.localKey, rowIndex, "key", e.target.value)} placeholder="Specification" />
                      <input className={inputClass.replace("mt-1 ", "")} value={row.value} onChange={(e) => updateVariantSpec(variant.localKey, rowIndex, "value", e.target.value)} placeholder="Value" />
                      <button type="button" className="px-2 text-sm font-semibold text-red-700" onClick={() => updateVariant(variant.localKey, { specifications: variant.specifications.filter((_, i) => i !== rowIndex) })}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {variants.length === 0 ? <p className="text-sm text-[var(--muted)]">No variants. This product will use the parent price and photos.</p> : null}
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Specifications</h2><button type="button" className="text-sm font-semibold text-[var(--walnut)]" onClick={() => setSpecifications((rows) => [...rows, { key: "", value: "" }])}>+ Add specification</button></div>
        <div className="mt-4 space-y-2">
          {specifications.map((row, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input className={inputClass.replace("mt-1 ", "")} value={row.key} onChange={(e) => updateSpec(index, "key", e.target.value)} placeholder="Material" />
              <input className={inputClass.replace("mt-1 ", "")} value={row.value} onChange={(e) => updateSpec(index, "value", e.target.value)} placeholder="Solid wood" />
              <button type="button" className="px-2 text-sm font-semibold text-red-700" onClick={() => setSpecifications((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-bold">Customization & service</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {customizationChoices.map((choice) => (
            <label key={choice} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={customizationOptions.includes(choice)} onChange={(e) => setCustomizationOptions((rows) => e.target.checked ? [...rows, choice] : rows.filter((row) => row !== choice))} /> {choice}</label>
          ))}
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className={labelClass}>Delivery<select className={inputClass} value={deliveryStatus} onChange={(e) => setDeliveryStatus(e.target.value as ServiceStatus)}><option value="included">Included</option><option value="not_included">Not included</option><option value="depends">Depends</option></select></label>
          <label className={labelClass}>Installation<select className={inputClass} value={installationStatus} onChange={(e) => setInstallationStatus(e.target.value as ServiceStatus)}><option value="included">Included</option><option value="not_included">Not included</option><option value="depends">Depends</option></select></label>
        </div>
        <div className="mt-5 flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={madeToOrder} onChange={(e) => setMadeToOrder(e.target.checked)} /> Made to order</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={customizable} onChange={(e) => setCustomizable(e.target.checked)} /> Customizable</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={acceptingOrders} onChange={(e) => setAcceptingOrders(e.target.checked)} /> Accepting orders</label>
        </div>
      </section>

      <section className="card p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <label className={labelClass}>Publication status<select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as PublicationStatus)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
          <button type="submit" disabled={saving} className="btn-primary min-w-40 disabled:opacity-60">{saving ? "Saving…" : initialProduct ? "Save product" : "Create product"}</button>
        </div>
      </section>
    </form>
  );
}
