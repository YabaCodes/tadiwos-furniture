begin;

create extension if not exists pgcrypto;

create type public.app_role as enum ('owner', 'admin', 'editor');
create type public.publication_status as enum ('draft', 'published', 'archived');
create type public.product_type as enum ('standard', 'configurable', 'made_to_measure');
create type public.price_mode as enum ('fixed', 'starting_from', 'variant', 'per_meter', 'per_square_meter', 'per_piece', 'quote_only', 'custom');
create type public.service_status as enum ('included', 'not_included', 'depends');
create type public.project_type as enum ('residential', 'office', 'commercial', 'institutional');
create type public.inquiry_type as enum ('product', 'custom', 'similar_project', 'general');
create type public.inquiry_status as enum ('new', 'contacted', 'quoted', 'confirmed', 'closed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'editor',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_am text,
  slug text not null unique,
  description_en text,
  description_am text,
  image_path text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_en_not_blank check (length(trim(name_en)) > 0),
  constraint categories_slug_not_blank check (length(trim(slug)) > 0)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name_en text not null,
  name_am text,
  slug text not null unique,
  reference_code text not null unique,
  description_en text,
  description_am text,
  product_type public.product_type not null default 'standard',
  has_variants boolean not null default false,
  price_mode public.price_mode not null default 'quote_only',
  price numeric(12,2),
  currency_code text not null default 'ETB',
  price_custom_text_en text,
  price_custom_text_am text,
  made_to_order boolean not null default true,
  customizable boolean not null default true,
  customization_options jsonb not null default '[]'::jsonb,
  specifications jsonb not null default '[]'::jsonb,
  delivery_status public.service_status not null default 'included',
  installation_status public.service_status not null default 'included',
  featured boolean not null default false,
  accepting_orders boolean not null default true,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_en_not_blank check (length(trim(name_en)) > 0),
  constraint products_reference_code_not_blank check (length(trim(reference_code)) > 0),
  constraint products_price_nonnegative check (price is null or price >= 0),
  constraint products_currency_code_format check (currency_code ~ '^[A-Z]{3}$'),
  constraint products_price_presence check (
    price_mode in ('variant', 'quote_only', 'custom') or price is not null
  )
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name_en text not null,
  name_am text,
  reference_code text,
  price_mode public.price_mode not null default 'fixed',
  price numeric(12,2),
  currency_code text not null default 'ETB',
  width numeric(10,2),
  height numeric(10,2),
  depth numeric(10,2),
  dimension_unit text not null default 'cm',
  description_en text,
  description_am text,
  specifications jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_name_not_blank check (length(trim(name_en)) > 0),
  constraint product_variants_price_mode check (price_mode <> 'variant'),
  constraint product_variants_price_nonnegative check (price is null or price >= 0),
  constraint product_variants_price_presence check (
    price_mode in ('quote_only', 'custom') or price is not null
  ),
  constraint product_variants_currency_code_format check (currency_code ~ '^[A-Z]{3}$'),
  constraint product_variants_unique_name unique (product_id, name_en),
  constraint product_variants_id_product_unique unique (id, product_id)
);

create unique index one_default_variant_per_product
  on public.product_variants(product_id)
  where is_default = true;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid,
  storage_path text not null,
  alt_text_en text,
  alt_text_am text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_images_storage_path_not_blank check (length(trim(storage_path)) > 0),
  constraint product_images_variant_product_fk
    foreign key (variant_id, product_id)
    references public.product_variants(id, product_id)
    on delete cascade
);

create unique index one_product_cover_image
  on public.product_images(product_id)
  where is_cover = true and variant_id is null;

create unique index one_variant_cover_image
  on public.product_images(variant_id)
  where is_cover = true and variant_id is not null;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_am text,
  slug text not null unique,
  project_type public.project_type not null,
  related_category_id uuid references public.categories(id) on delete set null,
  related_product_id uuid references public.products(id) on delete set null,
  location_en text,
  location_am text,
  description_en text,
  description_am text,
  completion_date date,
  featured boolean not null default false,
  status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_title_not_blank check (length(trim(title_en)) > 0)
);

create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  alt_text_en text,
  alt_text_am text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  constraint project_images_storage_path_not_blank check (length(trim(storage_path)) > 0)
);

create unique index one_project_cover_image
  on public.project_images(project_id)
  where is_cover = true;

create sequence public.inquiry_reference_seq start 1;

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default ('TAD-' || lpad(nextval('public.inquiry_reference_seq')::text, 6, '0')),
  customer_name text not null,
  phone text not null,
  inquiry_type public.inquiry_type not null default 'general',
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid,
  project_id uuid references public.projects(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  quantity integer,
  dimensions text,
  description text,
  status public.inquiry_status not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiries_customer_name_not_blank check (length(trim(customer_name)) > 0),
  constraint inquiries_phone_not_blank check (length(trim(phone)) > 0),
  constraint inquiries_quantity_positive check (quantity is null or quantity > 0),
  constraint inquiries_variant_requires_product check (variant_id is null or product_id is not null),
  constraint inquiries_variant_product_fk
    foreign key (variant_id, product_id)
    references public.product_variants(id, product_id)
    on delete set null
);

create table public.inquiry_attachments (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  constraint inquiry_attachments_storage_path_not_blank check (length(trim(storage_path)) > 0),
  constraint inquiry_attachments_size_nonnegative check (size_bytes is null or size_bytes >= 0)
);

create table public.site_settings (
  id smallint primary key default 1,
  business_name_en text not null default 'Tadiwos Furniture and Woodwork',
  business_name_am text,
  business_description_en text,
  business_description_am text,
  phone text,
  whatsapp text,
  telegram text,
  address_en text not null default 'Debre Birhan, Ethiopia',
  address_am text,
  currency_code text not null default 'ETB',
  default_delivery_status public.service_status not null default 'included',
  default_installation_status public.service_status not null default 'included',
  business_hours jsonb not null default '{}'::jsonb,
  logo_path text,
  favicon_path text,
  hero_title_en text not null default 'Custom furniture and woodwork built for your space.',
  hero_title_am text,
  hero_description_en text not null default 'Made-to-order furniture for homes, offices, commercial spaces and institutions in Debre Birhan.',
  hero_description_am text,
  hero_image_path text,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1),
  constraint site_settings_currency_format check (currency_code ~ '^[A-Z]{3}$')
);

insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

insert into public.categories (name_en, slug, sort_order) values
  ('Chairs & Seating', 'chairs-seating', 10),
  ('Tables & Desks', 'tables-desks', 20),
  ('Beds & Bedroom', 'beds-bedroom', 30),
  ('Storage & Shelving', 'storage-shelving', 40),
  ('Doors', 'doors', 50),
  ('TV & Living Room Furniture', 'tv-living-room', 60),
  ('Kitchen Cabinets', 'kitchen-cabinets', 70),
  ('Wardrobes & Built-ins', 'wardrobes-built-ins', 80),
  ('Commercial & Office', 'commercial-office', 90)
on conflict (slug) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants
for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();
create trigger inquiries_set_updated_at before update on public.inquiries
for each row execute function public.set_updated_at();
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, active)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), 'editor', false)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin', 'editor')
  );
$$;

revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_attachments enable row level security;
alter table public.site_settings enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.product_variants from anon, authenticated;
revoke all on table public.product_images from anon, authenticated;
revoke all on table public.projects from anon, authenticated;
revoke all on table public.project_images from anon, authenticated;
revoke all on table public.inquiries from anon, authenticated;
revoke all on table public.inquiry_attachments from anon, authenticated;
revoke all on table public.site_settings from anon, authenticated;

-- Public read grants. RLS further restricts rows.
grant select on public.categories, public.products, public.product_variants, public.product_images, public.projects, public.project_images, public.site_settings to anon;
grant select on public.categories, public.products, public.product_variants, public.product_images, public.projects, public.project_images, public.site_settings to authenticated;

-- Admin-capable authenticated users receive table privileges, with RLS enforcing active-admin membership.
grant select on public.profiles to authenticated;
grant insert, update, delete on public.categories, public.products, public.product_variants, public.product_images, public.projects, public.project_images, public.inquiries, public.inquiry_attachments to authenticated;
grant select on public.inquiries, public.inquiry_attachments to authenticated;
grant update on public.site_settings to authenticated;

grant usage on sequence public.inquiry_reference_seq to authenticated;

create policy "profiles_self_or_admin_read"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_active_admin());

create policy "public_active_categories_read"
on public.categories for select to anon, authenticated
using (active = true or public.is_active_admin());

create policy "admin_categories_manage"
on public.categories for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "public_published_products_read"
on public.products for select to anon, authenticated
using (status = 'published' or public.is_active_admin());

create policy "admin_products_manage"
on public.products for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "public_variants_of_published_products_read"
on public.product_variants for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'published'
  )
  or public.is_active_admin()
);

create policy "admin_product_variants_manage"
on public.product_variants for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "public_images_of_published_products_read"
on public.product_images for select to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'published'
  )
  or public.is_active_admin()
);

create policy "admin_product_images_manage"
on public.product_images for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "public_published_projects_read"
on public.projects for select to anon, authenticated
using (status = 'published' or public.is_active_admin());

create policy "admin_projects_manage"
on public.projects for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "public_images_of_published_projects_read"
on public.project_images for select to anon, authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.status = 'published'
  )
  or public.is_active_admin()
);

create policy "admin_project_images_manage"
on public.project_images for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

-- Inquiries are intentionally NOT writable by anon/authenticated browser clients.
-- Quote submissions will be validated server-side and inserted using a server-only service-role client.
create policy "admin_inquiries_manage"
on public.inquiries for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "admin_inquiry_attachments_manage"
on public.inquiry_attachments for all to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "public_site_settings_read"
on public.site_settings for select to anon, authenticated
using (id = 1);

create policy "admin_site_settings_update"
on public.site_settings for update to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

-- Storage policies assume the buckets are created through the Supabase Dashboard/API:
-- product-images (public), project-images (public), branding (public), inquiry-attachments (private).
create policy "admins_upload_public_media"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('product-images', 'project-images', 'branding')
  and public.is_active_admin()
);

create policy "admins_update_public_media"
on storage.objects for update to authenticated
using (
  bucket_id in ('product-images', 'project-images', 'branding')
  and public.is_active_admin()
)
with check (
  bucket_id in ('product-images', 'project-images', 'branding')
  and public.is_active_admin()
);

create policy "admins_delete_public_media"
on storage.objects for delete to authenticated
using (
  bucket_id in ('product-images', 'project-images', 'branding')
  and public.is_active_admin()
);

create policy "admins_read_private_inquiry_attachments"
on storage.objects for select to authenticated
using (bucket_id = 'inquiry-attachments' and public.is_active_admin());

create policy "admins_manage_private_inquiry_attachments"
on storage.objects for all to authenticated
using (bucket_id = 'inquiry-attachments' and public.is_active_admin())
with check (bucket_id = 'inquiry-attachments' and public.is_active_admin());

create index products_category_id_idx on public.products(category_id);
create index products_status_idx on public.products(status);
create index products_featured_idx on public.products(featured) where featured = true;
create index product_variants_product_id_idx on public.product_variants(product_id);
create index product_images_product_id_idx on public.product_images(product_id);
create index product_images_variant_id_idx on public.product_images(variant_id) where variant_id is not null;
create index projects_status_idx on public.projects(status);
create index projects_type_idx on public.projects(project_type);
create index project_images_project_id_idx on public.project_images(project_id);
create index inquiries_status_created_idx on public.inquiries(status, created_at desc);
create index inquiry_attachments_inquiry_id_idx on public.inquiry_attachments(inquiry_id);

commit;
