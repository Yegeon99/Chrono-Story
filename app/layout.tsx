import type { Metadata } from "next";
import { Noto_Serif_KR, JetBrains_Mono } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

const notoSerif = Noto_Serif_KR({
  variable: "--font-noto-serif",
  weight: ["700", "900"],
  subsets: ["latin"],
});

const jbMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Lore Guard — 세계관 정합성 QA",
    template: "%s · Lore Guard",
  },
  description:
    "크로노 오디세이 세계관 정합성·용어 일관성 QA 에이전트 (비공식 팬 포트폴리오)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSerif.variable} ${jbMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-archive">{children}</body>
    </html>
  );
}
