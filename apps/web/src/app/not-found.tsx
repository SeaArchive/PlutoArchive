import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="section">
      <span className="meta">404 / OUT OF ORBIT</span>
      <h1 className="page-title">기록을 찾을 수 없습니다.</h1>
      <Link href="/">아카이브로 돌아가기 →</Link>
    </main>
  );
}
