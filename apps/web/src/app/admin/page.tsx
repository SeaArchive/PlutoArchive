import Link from "next/link";
import { requireUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export default async function Admin() {
  const { db } = await requireUser(true);
  const { data, error } = await db
    .from("gallery_items")
    .select("id,title,created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load admin archive");
  return (
    <div className="admin-space admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" href="/">
          P↗ PLUTO ARCHIVE
        </Link>
        <p className="meta">CONTENT ADMINISTRATION</p>
        <nav>
          <a href="#dashboard">Dashboard</a>
          <a href="#portfolio">Portfolio</a>
          <Link href="/workspace">Workspace ↗</Link>
        </nav>
      </aside>
      <main id="main" className="admin-content">
        <span className="meta">ADMIN / FOUNDATION</span>
        <h1 id="dashboard">Archive overview.</h1>
        <p>기존 갤러리와 연결된 관리자 대시보드입니다.</p>
        <div className="admin-stat">
          <span className="meta">PUBLISHED ARTWORK</span>
          <b>{data?.length || 0}</b>
          <span>기존 작품 보존됨</span>
        </div>
        <h2 id="portfolio">Portfolio</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>작품</th>
              <th>등록일</th>
              <th>보기</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>{row.created_at.slice(0, 10)}</td>
                <td>
                  <Link href={"/works/" + row.id}>열기 ↗</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          블록 편집·분류·게시 관리 기능은 CMS 마이그레이션 단계에서 추가됩니다.
        </p>
        <form method="post" action="/auth/sign-out">
          <button>로그아웃</button>
        </form>
      </main>
    </div>
  );
}
