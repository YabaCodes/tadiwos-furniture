import Link from "next/link";

const categories = ["Chairs & Seating", "Tables & Desks", "Beds & Bedroom", "Doors", "Kitchen Cabinets", "Wardrobes & Built-ins"];

export default function HomePage() {
  return (
    <main>
      <section className="container-shell grid gap-10 py-16 md:grid-cols-[1.05fr_.95fr] md:py-24">
        <div className="self-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[.16em] text-[var(--forest)]">Debre Birhan, Ethiopia</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Custom furniture and woodwork built for your space.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Made-to-order furniture for homes, offices, commercial spaces and institutions — with standard models and custom work available.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary">Browse Furniture</Link>
            <Link href="/quote" className="btn-secondary">Request a Quote</Link>
          </div>
        </div>
        <div className="card flex min-h-80 items-center justify-center bg-[#eadfce] p-8 text-center text-[var(--walnut)]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.15em]">Hero image area</p>
            <p className="mt-3 max-w-sm text-sm opacity-75">Real furniture photography will replace this placeholder when the catalog is populated.</p>
          </div>
        </div>
      </section>

      <section className="container-shell py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.14em] text-[var(--forest)]">Catalog</p>
            <h2 className="mt-2 text-3xl font-bold">Furniture categories</h2>
          </div>
          <Link href="/products" className="text-sm font-semibold text-[var(--walnut)]">View all →</Link>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category} className="card min-h-36 p-6">
              <p className="font-semibold">{category}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Catalog content will be managed from Supabase.</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
