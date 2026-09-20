-- DEVELOPMENT-ONLY example product. Run manually if you want a quick variant test.
-- It is created as DRAFT so it will not appear publicly until an admin publishes it.

with bed_category as (
  select id from public.categories where slug = 'beds-bedroom' limit 1
), inserted_product as (
  insert into public.products (
    category_id, name_en, slug, reference_code, description_en,
    product_type, has_variants, price_mode, customizable, status
  )
  select id, 'Demo Bed B01', 'demo-bed-b01', 'BED-B01',
    'Development sample for testing the configurable product flow.',
    'configurable', true, 'variant', true, 'draft'
  from bed_category
  on conflict (slug) do update set updated_at = now()
  returning id
)
insert into public.product_variants (product_id, name_en, price_mode, price, dimension_unit, sort_order, is_default)
select id, '1.0 m', 'fixed', 22000, 'm', 10, true from inserted_product
union all
select id, '1.2 m', 'fixed', 25000, 'm', 20, false from inserted_product
union all
select id, '1.5 m', 'starting_from', 29000, 'm', 30, false from inserted_product;
