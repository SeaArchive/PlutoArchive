import Link from "next/link";
import { configured } from "@/lib/supabase";
export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const messages: Record<string, string> = {
    configuration: "서버의 Supabase 연결 설정이 필요합니다.",
    permission: "이 공간에 접근할 관리자 권한이 없습니다.",
    provider:
      "Google 로그인 연결을 시작하지 못했습니다. 공급자 설정을 확인해 주세요.",
    callback: "로그인을 완료하지 못했습니다. 다시 시도해 주세요.",
  };
  return (
    <div className="private-space login-page">
      <main id="main" className="login-panel">
        <Link href="/" className="meta">
          ← PLUTO ARCHIVE
        </Link>
        <span className="meta status">PRIVATE / AUTHENTICATION</span>
        <h1>
          Your own
          <br />
          working orbit.
        </h1>
        <p>작업과 기록을 한곳에서 이어가세요.</p>
        {reason && (
          <p role="alert">
            {messages[reason] || "로그인을 다시 시도해 주세요."}
          </p>
        )}
        <form action="/auth/sign-in" method="post">
          <button className="primary" disabled={!configured()}>
            Google 계정으로 로그인 ↗
          </button>
        </form>
        <p className="fine">Google Drive·YouTube 권한은 요청하지 않습니다.</p>
        <Link className="text-link" href="/workspace/preview">
          Workspace 화면 미리보기 →
        </Link>
      </main>
    </div>
  );
}
