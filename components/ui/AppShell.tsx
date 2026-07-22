"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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

  const isActive = (item: NavItem) =>
    pathname === item.href ||
    (item.match ?? []).some((p) => pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-transparent">
      {/* ---------- แถบบน ---------- */}
      <header className="sticky top-0 z-40 border-b border-tu-gold-500/60 bg-tu-red-500">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="rounded-md">
            <Brand size="sm" variant="light" />
          </Link>
          {action}
        </div>
      </header>

      {/* ---------- เมนูมือถือ ---------- */}
      {nav.length > 0 && (
        <nav className="border-b border-line bg-paper-50 lg:hidden">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            {nav.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
                    active
                      ? "bg-tu-red-500 text-white"
                      : "text-ink-600 hover:bg-paper-200"
                  }`}
                >
                  <span className="[&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ---------- เนื้อหา ---------- */}
      <div className="mx-auto flex max-w-6xl gap-16 px-4 py-12 sm:px-6">
        {/* เมนูข้าง (จอใหญ่) */}
        {nav.length > 0 && (
          <nav className="hidden w-48 flex-shrink-0 lg:block">
            <div className="sticky top-[4.5rem] space-y-0.5">
              {/* leading กว้างพอ ไม่ให้สระ/วรรณยุกต์ไทยด้านบนถูกตัด */}
              <p className="mb-2 px-3 text-[11px] font-bold leading-6 tracking-wide text-ink-400">
                เมนู
              </p>
              {nav.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-white text-tu-red-700 shadow-card"
                        : "text-ink-600 hover:bg-paper-200 hover:text-ink-800"
                    }`}
                  >
                    {/* ขีดแดงหน้าเมนูที่เลือก */}
                    {active && (
                      <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-tu-red-500" />
                    )}
                    <span
                      className={`[&>svg]:h-4 [&>svg]:w-4 ${
                        active ? "text-tu-red-500" : "text-ink-400"
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
        )}

        <main className={`min-w-0 flex-1 animate-slide-up ${width}`}>
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
