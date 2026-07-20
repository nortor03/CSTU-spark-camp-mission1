import Link from "next/link";
import type { ReactNode } from "react";
import Brand from "./Brand";

/**
 * โครงหน้าเข้าสู่ระบบ (ใช้ร่วมกันทั้งอาจารย์และนักเรียน)
 * - ซ้าย: รูปตึกโดม มธ. ล้วน ๆ ไม่มีโลโก้/ข้อความทับ
 * - ขวา: ฟอร์ม บนพื้นกระดาษครีม (แถบแบรนด์แดงจะโผล่เฉพาะจอแคบที่ซ่อนรูป)
 */
export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  switchHref,
  switchLabel,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  /** ลิงก์สลับไปหน้า login ของอีกบทบาท */
  switchHref: string;
  switchLabel: string;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* ---------- ฝั่งซ้าย: ภาพตึกโดมล้วน (ไม่มีโลโก้/ข้อความ) ---------- */}
      <div
        className="relative hidden overflow-hidden bg-paper-200 bg-cover bg-center lg:block"
        style={{ backgroundImage: "url('/tu-login.jpg')" }}
        aria-hidden
      />

      {/* ---------- ฝั่งขวา: ฟอร์ม ---------- */}
      <div className="flex flex-col bg-paper-100">
        {/* แถบแบรนด์เล็ก ๆ สำหรับจอแคบ (ฝั่งซ้ายถูกซ่อน) */}
        <div className="border-b border-tu-gold-500/60 bg-tu-red-500 px-6 py-3 lg:hidden">
          <Brand size="sm" variant="light" />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-sm">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="display mt-1.5 text-3xl">{title}</h1>
            <hr className="rule-gold my-4" />
            <p className="mb-7 text-sm leading-relaxed text-ink-500">
              {subtitle}
            </p>

            {children}

            <div className="mt-8 border-t border-line pt-5 text-center">
              <Link
                href={switchHref}
                className="text-xs font-semibold text-ink-500 underline decoration-line-strong underline-offset-4 transition hover:text-tu-red-600"
              >
                {switchLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
