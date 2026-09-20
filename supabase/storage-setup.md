# Storage bucket setup

Create these buckets using the Supabase Dashboard or Storage API (not by directly mutating the storage schema):

1. `product-images` — Public — images only — recommended max 10 MB/object.
2. `project-images` — Public — images only — recommended max 10 MB/object.
3. `branding` — Public — images only — recommended max 5 MB/object.
4. `inquiry-attachments` — Private — images only — recommended max 10 MB/object.

The initial migration already creates authenticated-admin policies on `storage.objects` for these bucket IDs.
Anonymous customer uploads should be handled later by a validated server endpoint using the server-only service-role key, not by granting anonymous Storage upload permission.
