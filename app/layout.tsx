import type { Metadata } from "next";
import { Gowun_Batang, JetBrains_Mono } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

// Display face: Gowun Batang — a Korean myeongjo with calligraphic stroke
// terminals. Chosen over a neutral system serif because titles and the verdict
// seal carry the "고문서" half of the concept (DIRECTIVE §5).
const gowun = Gowun_Batang({
  variable: "--font-gowun",
  weight: ["400", "700"],
  // Google does not declare a named `korean` subset for this family — the Hangul
  // glyphs ship as unnamed unicode-range blocks, which next/font emits either
  // way. preload:false keeps those blocks demand-loaded instead of preloading
  // every chunk for the handful of words that use the display face.
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["Nanum Myeongjo", "Batang", "serif"],
});

const jbMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  display: "swap",
});

// Production URL resolution: explicit override first, then the Vercel-provided
// production domain, then localhost for dev. metadataBase makes every relative
// OG/twitter image URL absolute.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const SITE_DESCRIPTION =
  "크로노 오디세이 세계관 정합성·용어 일관성 QA 에이전트 (비공식 팬 포트폴리오)";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lore Guard — 세계관 정합성 QA",
    template: "%s · Lore Guard",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Lore Guard",
    title: "Lore Guard — 세계관 정합성 QA (내러티브 CI)",
    description: SITE_DESCRIPTION,
    locale: "ko_KR",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Lore Guard — 크로노 오디세이 내러티브 CI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lore Guard — 세계관 정합성 QA (내러티브 CI)",
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${gowun.variable} ${jbMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-archive">{children}</body>
    </html>
  );
}
