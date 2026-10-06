import type { Metadata } from "next";
import "./globals.css";
import { Starfield } from "@/components/starfield";
export const metadata: Metadata = {
  title: {
    default: "Pluto Archive — Art, Design & Development",
    template: "%s | Pluto Archive",
  },
  description: "Artwork, projects, and the thinking that connects them.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Starfield />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
