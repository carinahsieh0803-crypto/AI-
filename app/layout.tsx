import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "日日｜把時間留給重要的事",
  description: "個人行程規劃與小組共享行事曆",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
