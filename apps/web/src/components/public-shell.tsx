import Link from "next/link";
import site from "@/config/site.json";
export function PublicShell({
  children,
  home = false,
}: {
  children: React.ReactNode;
  home?: boolean;
}) {
  return (
    <div className={home ? "public-space public-home" : "public-space"}>
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Pluto Archive 홈">
          <span className="brand-mark">P↗</span>
          {site.name}
        </Link>
        <nav aria-label="주 메뉴">
          {site.navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="workspace-link" href="/workspace">
          Workspace <span>↗</span>
        </Link>
      </header>
      <main id="main">{children}</main>
      <footer>
        <Link href="/">PLUTO ARCHIVE</Link>
        <span>ART · DESIGN · DEVELOPMENT</span>
        <Link href="/contact">연락하기 ↗</Link>
        <span>© {new Date().getFullYear()} SEAARCHIVE</span>
      </footer>
    </div>
  );
}
