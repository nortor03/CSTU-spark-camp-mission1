import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { CourseProvider } from "@/lib/courseStore";

/**
 * ฟอนต์เดียวทั้งแอป (เนื้อความ + หัวเรื่อง) — ตัดคอนทราสต์ serif/sans แบบเอกสารวิชาการทิ้ง
 * เปลี่ยนมาไล่น้ำหนักตัวอักษรแทน (bold สำหรับหัวเรื่อง) ให้ดู clean/modern ขึ้น
 */
const plexThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-thai",
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
    <html lang="th" className={plexThai.variable}>
      <body className="font-sans antialiased">
        <CourseProvider>{children}</CourseProvider>
      </body>
    </html>
  );
}
