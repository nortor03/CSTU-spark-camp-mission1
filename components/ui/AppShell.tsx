"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import Brand from "./Brand";

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
}: {
  nav?: NavItem[];
  /** ปุ่มมุมขวาบน เช่น ออกจากระบบ */
  action?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (item: NavItem) =>
    pathname === item.href ||
    (item.match ?? []).some((p) => pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-transparent">
      {/* ---------- แถบบน ---------- */}
      <header className="sticky top-0 z-40 border-b border-tu-gold-500/60 bg-tu-red-500">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-12">
          <div className="flex items-center gap-3">
            {nav.length > 0 && (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="text-white hover:text-white/80 transition-colors p-1 -ml-1 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Open menu"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
            <Link href="/" className="rounded-md">
              <Brand size="sm" variant="light" />
            </Link>
          </div>
          {action}
        </div>
      </header>

      {/* ---------- เนื้อหา ---------- */}
      <div className="flex w-full justify-center gap-8 px-4 py-12 sm:px-6 lg:px-12 lg:gap-16">
        {/* เมนูแบบ Drawer */}
        {nav.length > 0 && (
          <>
            {/* Backdrop */}
            {isMenuOpen && (
              <div 
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsMenuOpen(false)}
              />
            )}
            
            {/* Sidebar Drawer */}
            <nav 
              className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-paper-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
                isMenuOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="flex h-14 items-center px-4 border-b border-tu-gold-500/60 bg-tu-red-500">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white hover:text-white/80 p-1 -ml-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Close menu"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <div className="ml-3 mt-[1px]">
                  <Brand size="sm" variant="light" />
                </div>
              </div>
              <div className="p-4 overflow-y-auto space-y-1">
                <p className="mb-2 px-3 text-[11px] font-bold leading-6 tracking-wide text-ink-400 uppercase">
                  เมนูหลัก
                </p>
                {nav.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all duration-200 ${
                        active
                          ? "bg-white text-tu-red-700 shadow-sm border border-tu-red-100/50"
                          : "text-ink-600 hover:bg-paper-200 hover:text-ink-900"
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-2 left-0 w-[4px] rounded-r-md bg-tu-red-500" />
                      )}
                      <span
                        className={`[&>svg]:h-5 [&>svg]:w-5 transition-colors ${
                          active ? "text-tu-red-500" : "text-ink-400 group-hover:text-ink-600"
                        }`}
                      >
                        {item.icon}
                      </span>
                      {item.label}
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

/* ---------- ไอคอนเมนู ---------- */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconCourse = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <path d="M4 5.5A1.5 1.5 0 015.5 4H10a2 2 0 012 2v13a2 2 0 00-2-2H5.5A1.5 1.5 0 014 15.5v-10zM20 5.5A1.5 1.5 0 0018.5 4H14a2 2 0 00-2 2v13a2 2 0 012-2h4.5a1.5 1.5 0 001.5-1.5v-10z" />
  </svg>
);

export const IconTopics = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconUpload = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <path d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
  </svg>
);

export const IconQuiz = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <path d="M9 11l2 2 4-4" />
    <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
  </svg>
);

export const IconReport = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <path d="M4 20h16" />
    <path d="M7 20v-6M12 20V7M17 20v-9" />
  </svg>
);
