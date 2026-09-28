import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ArtworkUploadForm } from "./upload-form";
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
          <a href="#upload-heading">Upload</a>
          <a href="#portfolio">Portfolio</a>
          <Link href="/workspace">Workspace ↗</Link>
        </nav>
      </aside>
      <main id="main" className="admin-content">
        <span className="meta">ADMIN / PORTFOLIO</span>
        <h1 id="dashboard">Archive overview.</h1>
        <p>공개 작품을 올리고 기존 갤러리를 확인하는 관리자 공간입니다.</p>
        <div className="admin-stat">
          <span className="meta">PUBLISHED ARTWORK</span>
          <b>{data?.length || 0}</b>
          <span>공개 갤러리</span>
        </div>
        <ArtworkUploadForm />
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
          비공개 초안·블록 편집·분류 및 게시 취소는 추후 CMS 관리 화면에서
          제공합니다.
        </p>
        <form method="post" action="/auth/sign-out">
          <button>로그아웃</button>
        </form>
      </main>
    </div>
  );
}
