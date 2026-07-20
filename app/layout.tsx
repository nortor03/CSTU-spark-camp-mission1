import type { Metadata } from "next";
import { Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import "./globals.css";
import { CourseProvider } from "@/lib/courseStore";

/** ฟอนต์เนื้อความ */
const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-thai",
  display: "swap",
});

/** ฟอนต์หัวเรื่อง (serif) — ให้ความรู้สึกเป็นเอกสารวิชาการ */
const notoSerifThai = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-serif-thai",
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
    <html
      lang="th"
      className={`${notoThai.variable} ${notoSerifThai.variable}`}
    >
      <body className="font-sans antialiased">
        <CourseProvider>{children}</CourseProvider>
      </body>
    </html>
  );
}
