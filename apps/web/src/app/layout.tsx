import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Pluto Archive — Art, Design & Development",
    template: "%s | Pluto Archive",
  },
  description: "작품과 프로젝트, 그리고 그 사이의 생각을 기록하는 공간.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main">
          본문으로 건너뛰기
        </a>
        {children}
      </body>
    </html>
  );
}
