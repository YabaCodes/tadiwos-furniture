# Tadiwos Furniture and Woodwork

V1 implementation starter for the bilingual digital showroom and quotation website defined in `docs/V1_Product_Requirements.docx`.

## Current implementation status

This package implements the first two build phases:

- Next.js 16 / React 19 / TypeScript project foundation.
- Tailwind CSS 4 styling foundation and initial public brand shell.
- Public routes for Home, Products, Projects, Custom Furniture, Quote, About and Contact.
- Supabase browser/server clients using `@supabase/ssr`.
- Next.js 16 `proxy.ts` session-refresh pattern.
- Protected admin route group and working email/password login shell.
- Initial admin dashboard + placeholders for Products, Projects, Inquiries and Settings.
- PostgreSQL schema, enums, constraints, indexes and RLS policies.
- Initial categories and editable `Tadiwos Furniture and Woodwork` site setting.
- Storage security policy definitions and bucket setup instructions.

The product CRUD editor, dynamic variant product detail, project CRUD, inquiry form and WhatsApp handoff are intentionally the next phases.

## Requirements

- Node.js 22+
- npm
- A Supabase project

## 1. Install

```bash
npm install
```

## 2. Configure environment

Copy the example file:

```bash
cp .env.example .env.local
```

Add values from the Supabase project **Connect** panel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_ONLY_SECRET_KEY
```

Never expose `SUPABASE_SECRET_KEY` in client code or commit `.env.local`.

## 3. Apply the database migration

Use either the Supabase CLI migration workflow or paste/run:

`supabase/migrations/202609200001_initial_schema.sql`

in a suitable Supabase SQL/migration workflow.

The migration creates:

- profiles
- categories
- products
- product_variants
- product_images
- projects
- project_images
- inquiries
- inquiry_attachments
- site_settings
- enums, indexes, triggers and RLS policies

## 4. Create Storage buckets

Follow `supabase/storage-setup.md`.

Required bucket IDs:

- `product-images` (public)
- `project-images` (public)
- `branding` (public)
- `inquiry-attachments` (private)

## 5. Create the first admin

Public sign-up is not part of the application.

1. In Supabase Authentication, create/invite the intended owner account.
2. The database trigger creates a `profiles` row with `active = false`.
3. Activate the owner in SQL after confirming the user's UUID:

```sql
update public.profiles
set role = 'owner', active = true, full_name = 'Tadiwos'
where id = 'AUTH_USER_UUID';
```

Repeat for the supporting admin, using role `admin` or `editor` and `active = true`.

## 6. Start locally

```bash
npm run dev
```

Open:

- Public: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

## Optional development seed

`supabase/seed.example.sql` creates a draft Demo Bed B01 with 1.0 m, 1.2 m and 1.5 m variants. It is not applied automatically.

## Security decisions already implemented

- Public users can only read active/published catalog content and public site settings.
- Browser clients cannot insert/read inquiries.
- Customer inquiries will be inserted later through validated server-side code using the server-only secret-key client.
- Inquiry attachments are private.
- Admin access requires both a valid Supabase Auth session and an active admin profile.
- RLS policies enforce data access at the database level.

## Next build milestone

Implement the complete Product Admin workflow and the first real configurable product end-to-end:

1. Add/edit/archive product.
2. Upload/reorder product photos.
3. Add 1.0 m / 1.2 m / 1.5 m variants.
4. Publish product.
5. Render `/product/[slug]`.
6. Switch variant buttons dynamically and update price/photos/specifications.
