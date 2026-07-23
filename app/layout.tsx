import type { Metadata } from "next";
import { Mitr } from "next/font/google";
import "./globals.css";
import { CourseProvider } from "@/lib/courseStore";

/**
 * ฟอนต์เดียวทั้งแอป (เนื้อความ + หัวเรื่อง) — ใช้ฟอนต์ Mitr ที่มีหัวกลมมนและโมเดิร์น
 */
const mitr = Mitr({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-mitr",
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
    <html lang="th" className={mitr.variable}>
      <body className="font-sans antialiased">
        <CourseProvider>{children}</CourseProvider>
      </body>
    </html>
  );
}
