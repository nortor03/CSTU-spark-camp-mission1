"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import Brand from "./Brand";
import {
  Menu,
  X,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (item: NavItem) =>
    pathname === item.href ||
    (item.match ?? []).some((p) => pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-transparent">
      {/* ---------- แถบบน (Sleek Glassmorphism Header) ---------- */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-tu-red-650 via-tu-red-500 to-tu-red-700 backdrop-blur-md shadow-md">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-12">
          <div className="flex items-center gap-4">
            {nav.length > 0 && (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white/10 hover:text-tu-gold-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 active:scale-95"
                aria-label="Open menu"
              >
                <Menu className="w-5.5 h-5.5 transition-transform duration-300 group-hover:rotate-12" strokeWidth={2} />
              </button>
            )}
            <Link href={homeHref} className="rounded-xl transition-transform duration-250 hover:scale-[1.02] focus:outline-none">
              <Brand size="sm" variant="light" />
            </Link>
          </div>
          {action}
        </div>
        {/* เส้นทองหรูไล่เฉดด้านล่าง */}
        <div className="h-[2.5px] w-full bg-gradient-to-r from-tu-gold-600 via-amber-300 to-tu-gold-500" />
      </header>

      {/* ---------- เนื้อหา ---------- */}
      <div className="flex w-full justify-center gap-8 px-4 py-12 sm:px-6 lg:px-12 lg:gap-16">
        {/* เมนูแบบ Drawer */}
        {nav.length > 0 && (
          <>
            {/* Backdrop */}
            {isMenuOpen && (
              <div 
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setIsMenuOpen(false)}
              />
            )}
            
            {/* Sidebar Drawer */}
            <nav 
              className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-paper-50 shadow-3xl transition-transform duration-300 ease-out flex flex-col ${
                isMenuOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              {/* Drawer Header */}
              <div className="relative flex h-16 items-center px-5 bg-gradient-to-r from-tu-red-650 to-tu-red-750">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="group flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white hover:bg-white/10 hover:text-tu-gold-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
                </button>
                <div className="ml-4">
                  <Brand size="sm" variant="light" />
                </div>
                {/* Accent line for drawer header */}
                <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-tu-gold-600 via-amber-300 to-tu-gold-500" />
              </div>

              {/* Drawer Menu Items */}
              <div className="p-5 overflow-y-auto flex-1 space-y-1.5 bg-paper-50">
                <p className="mb-3 px-3 text-[10.5px] font-bold leading-6 tracking-widest text-ink-400 uppercase">
                  เมนูหลัก
                </p>
                {nav.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`group relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-[14.5px] font-bold transition-all duration-250 ${
                        active
                          ? "bg-white text-tu-red-700 shadow-sm border border-tu-red-100/40"
                          : "text-ink-600 hover:bg-paper-200 hover:text-ink-950"
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-2.5 left-0 w-[4px] rounded-r-full bg-tu-red-500" />
                      )}
                      <span
                        className={`[&>svg]:h-5 [&>svg]:w-5 transition-colors duration-250 ${
                          active ? "text-tu-red-500" : "text-ink-400 group-hover:text-ink-700"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </>
        )}

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
