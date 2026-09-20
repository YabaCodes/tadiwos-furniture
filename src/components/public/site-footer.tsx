import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="container-shell grid gap-8 py-10 md:grid-cols-3">
        <div>
          <p className="font-bold text-[var(--walnut)]">Tadiwos Furniture and Woodwork</p>
          <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
            Made-to-order furniture and woodwork in Debre Birhan.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Explore</p>
          <div className="mt-3 grid gap-2 text-[var(--muted)]">
            <Link href="/products">Products</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/custom-furniture">Custom Furniture</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Location</p>
          <p className="mt-3 text-[var(--muted)]">Debre Birhan, Ethiopia</p>
        </div>
      </div>
    </footer>
  );
}
