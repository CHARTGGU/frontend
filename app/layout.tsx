import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChartSkin",
  description: "차트 위에 스킨을 입혀 나만의 트레이딩 뷰를 만드는 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
