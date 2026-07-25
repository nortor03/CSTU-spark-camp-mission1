import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { CourseProvider } from "@/lib/courseStore";

/**
 * ฟอนต์เดียวทั้งแอป (เนื้อความ + หัวเรื่อง) — Noto Sans Thai: สะอาด เป็นกลาง โมเดิร์น
 * หมายเหตุ: คงชื่อตัวแปร CSS เดิม (--font-mitr) ไว้ เพื่อให้จุดอื่นที่อ้างถึง
 * (tailwind, surveyTheme, globals) เปลี่ยนตามอัตโนมัติโดยไม่มีตกหล่น
 */
const appFont = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="th" className={appFont.variable}>
      <body className="font-sans antialiased">
        <CourseProvider>{children}</CourseProvider>
      </body>
    </html>
  );
}
