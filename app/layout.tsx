import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { CourseProvider } from "@/lib/courseStore";

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TONLABKIT — ระบบจัดการเอกสารการสอน",
  description: "อัปโหลดเอกสารการสอนและจัดกลุ่มหัวข้อรายสัปดาห์",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={notoThai.variable}>
      <body className="font-sans antialiased">
        <CourseProvider>{children}</CourseProvider>
      </body>
    </html>
  );
}
