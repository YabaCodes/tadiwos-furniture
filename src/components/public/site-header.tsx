import Link from "next/link";

const links = [
  ["Products", "/products"],
  ["Projects", "/projects"],
  ["Custom Furniture", "/custom-furniture"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]/95">
      <div className="container-shell flex min-h-20 items-center justify-between gap-6">
        <Link href="/" className="font-bold tracking-tight text-[var(--walnut)]">
          Tadiwos Furniture and Woodwork
        </Link>
        <nav className="hidden items-center gap-5 text-sm md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-[var(--walnut)]">
              {label}
            </Link>
          ))}
          <Link href="/quote" className="btn-primary">Request a Quote</Link>
        </nav>
        <Link href="/products" className="text-sm font-semibold md:hidden">Menu</Link>
      </div>
    </header>
  );
}
