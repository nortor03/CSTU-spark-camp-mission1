"use client";

import type { WeekSummary } from "@/lib/useTopics";
import { resolveHex, weekNumber } from "@/lib/weeks";

/**
 * ตัวกรองรายสัปดาห์แบบที่คั่นหนังสือ (Bookmark Dropdown)
 * - ชิ้นหลักแสดงสถานะปัจจุบัน
 * - ชี้เมาส์ (Hover) แล้วกางออกเป็นแนวนอน
 */
export default function WeekBookmarks({
  filter,
  unassignedCount,
  weekSummaries,
  onFilter,
}: {
  filter: string;
  unassignedCount: number;
  weekSummaries: WeekSummary[];
  onFilter: (mode: string) => void;
}) {
  const isActiveAll = filter === "all";
  const activeSummary = weekSummaries.find((w) => w.week === filter);

  // สีและข้อความของ Bookmark หลัก
  const mainHex = isActiveAll
    ? "#1C1614" // สี ink-900 สำหรับ All
    : activeSummary
      ? resolveHex(activeSummary.colorKey)
      : "#1C1614";
  const mainLabel = isActiveAll ? "All" : weekNumber(filter);
  const mainCount = isActiveAll ? unassignedCount : activeSummary?.count ?? 0;

  // รูปทรงที่คั่นหนังสือ (สี่เหลี่ยมโดนตัดมุมล่างเป็นสามเหลี่ยม)
  const bookmarkShape =
    "[clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-8px),0_100%)]";

  return (
    <div className="group relative z-[100] flex justify-end -mt-3.5 -mr-2">
      {/* Bookmark หลัก (แสดงตัวเลือกปัจจุบัน) */}
      <div
        className={`relative flex w-12 cursor-default flex-col items-center justify-start pb-3 pt-2 text-white shadow-md transition-transform group-hover:-translate-y-1 ${bookmarkShape}`}
        style={{ backgroundColor: mainHex, minHeight: "68px" }}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
          {isActiveAll ? "All" : "Wk"}
        </span>
        <span className="mt-0.5 text-lg font-bold leading-none">
          {mainLabel}
        </span>
        <span className="absolute bottom-4 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white backdrop-blur-sm">
          {mainCount}
        </span>
      </div>

      {/* เมนูที่คั่นหนังสือย่อยที่จะกางออกมาเมื่อ Hover (เรียงแนวนอนไปทางขวา) */}
      <div className="absolute right-0 top-0 hidden flex-row justify-end items-start gap-1.5 pt-0 group-hover:flex pr-14">
        {/* ยังไม่จัดกลุ่ม (All) */}
        {!isActiveAll && (
          <button
            onClick={() => onFilter("all")}
            className={`relative flex w-11 flex-col items-center justify-start bg-ink-800 pb-2.5 pt-1.5 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-md ${bookmarkShape} animate-in slide-in-from-right-4 fade-in duration-200`}
            style={{ minHeight: "56px" }}
          >
            <span className="mt-1 text-xs font-bold">All</span>
            <span className="mt-1 rounded-full bg-white/20 px-1.5 text-[9px] font-bold">
              {unassignedCount}
            </span>
          </button>
        )}

        {/* สัปดาห์ทั้งหมด */}
        {weekSummaries.map(({ week, count, colorKey }) => {
          if (filter === week) return null;
          const hex = resolveHex(colorKey);
          return (
            <button
              key={week}
              onClick={() => onFilter(week)}
              title={`${week} · ${count} หัวข้อ`}
              style={{ backgroundColor: hex, minHeight: "56px" }}
              className={`relative flex w-11 flex-col items-center justify-start pb-2.5 pt-1.5 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-md ${bookmarkShape} animate-in slide-in-from-right-4 fade-in duration-200`}
            >
              <span className="mt-1 text-xs font-bold">
                {weekNumber(week)}
              </span>
              <span className="mt-1 rounded-full bg-white/25 px-1.5 text-[9px] font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
