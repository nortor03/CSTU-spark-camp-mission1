"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import Brand from "./Brand";
import {
  BookOpen,
  LayoutGrid,
  Upload,
  ClipboardCheck,
  BarChart3,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** เส้นทางที่ถือว่า "อยู่ในเมนูนี้" (นอกจาก href เอง) */
  match?: string[];
  icon: ReactNode;
}

/**
 * โครงหน้าหลักของทั้งแอป
 * - แถบบนสีแดงธรรมศาสตร์ (เต็มความกว้าง) + เส้นทองคั่นด้านล่าง
 * - เมนูข้างซ้ายบนจอใหญ่ / แถบเลื่อนแนวนอนบนมือถือ
 * - พื้นหลังกระดาษครีม
 */
export default function AppShell({
  nav = [],
  action,
  children,
  width = "max-w-4xl",
  homeHref = "/",
}: {
  nav?: NavItem[];
  /** ปุ่มมุมขวาบน เช่น ออกจากระบบ */
  action?: ReactNode;
  children: ReactNode;
  width?: string;
  /** ปลายทางเมื่อกดโลโก้ — ต่างกันตามบทบาท (อาจารย์/นักเรียน) */
  homeHref?: string;
}) {
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    pathname === item.href ||
    (item.match ?? []).some((p) => pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-transparent">
      {/* ---------- แถบบน (Solid Red, Inline Nav - No Hamburger) ---------- */}
      <header className="sticky top-0 z-40 bg-tu-red-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-12">
          {/* Logo & Desktop Nav */}
          <div className="flex min-w-0 items-center gap-6">
            <Link href={homeHref} className="flex-shrink-0 rounded-xl transition-transform duration-200 hover:scale-[1.02] focus:outline-none">
              <Brand size="sm" variant="light" />
            </Link>

            {/* Desktop Navigation — segmented track + pill tabs */}
            {nav.length > 0 && (
              <nav className="hidden items-center gap-0.5 rounded-2xl bg-black/12 p-1 md:flex">
                {nav.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-2 rounded-xl px-4 py-2 text-[13.5px] font-bold transition-all duration-200 ${
                        active
                          ? "bg-white text-tu-red-700 shadow-sm"
                          : "text-white/75 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span
                        className={`[&>svg]:h-4 [&>svg]:w-4 transition-colors duration-200 ${
                          active ? "text-tu-red-500" : "text-white/60 group-hover:text-white"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Profile & SignOut */}
          <div className="flex flex-shrink-0 items-center gap-4">
            {action}
          </div>
        </div>

        {/* Mobile Navigation — same segmented track, full width */}
        {nav.length > 0 && (
          <nav className="flex items-center gap-0.5 border-t border-white/10 px-3 py-2 md:hidden">
            {nav.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                    active
                      ? "bg-white text-tu-red-700 shadow-sm"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className={`[&>svg]:h-3.5 [&>svg]:w-3.5 ${active ? "text-tu-red-500" : ""}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* เส้นทองหรูด้านล่างสุด — ลายเซ็นแบรนด์ */}
        <div className="h-[3px] w-full bg-gradient-to-r from-tu-gold-500 via-tu-gold-400 to-tu-gold-500 shadow-[0_1px_10px_rgba(242,169,0,0.45)]" />
      </header>

      {/* ---------- เนื้อหา ---------- */}
      <div className="flex w-full justify-center gap-8 px-4 py-12 sm:px-6 lg:px-12 lg:gap-16">
        <main className={`min-w-0 w-full animate-slide-up ${width}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

/* ---------- ไอคอนเมนู (lucide) ---------- */

export const IconCourse = <BookOpen strokeWidth={1.8} />;
export const IconTopics = <LayoutGrid strokeWidth={1.8} />;
export const IconUpload = <Upload strokeWidth={1.8} />;
export const IconQuiz = <ClipboardCheck strokeWidth={1.8} />;
export const IconReport = <BarChart3 strokeWidth={1.8} />;
