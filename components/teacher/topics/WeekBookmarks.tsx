"use client";

import type { WeekSummary } from "@/lib/useTopics";
import { tagStyles, weekNumber } from "@/lib/weeks";

/** รูปทรงที่คั่นหนังสือ (มีรอยบากตรงกลางด้านล่าง) */
const BOOKMARK_SHAPE = "polygon(0 0, 100% 0, 100% 100%, 50% 76%, 0 100%)";

/**
 * ตัวกรองรายสัปดาห์แบบ "ที่คั่นหนังสือ"
 * - ปกติที่คั่นจะซ้อนกันเป็นตั้ง (overlap)
 * - เมื่อ hover ทั้งแถบจะคลี่ออกให้เห็นทุกอัน
 * - ที่คั่นแต่ละอันแสดงเลขสัปดาห์เฉย ๆ
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
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        ตัวกรอง
      </span>

      {/* แถบที่คั่น — hover เพื่อคลี่ */}
      <div className="group flex items-start pt-0.5">
        {/* ที่คั่น "ยังไม่จัดกลุ่ม" (ฐานของตั้ง มองเห็นตลอด) */}
        <button
          onClick={() => onFilter("all")}
          title={`ยังไม่จัดกลุ่ม · ${unassignedCount} หัวข้อ`}
          style={{ clipPath: BOOKMARK_SHAPE }}
          className={`relative z-0 flex h-11 w-8 flex-col items-center justify-start bg-slate-400 pt-1.5 text-white transition-all duration-300 ease-out hover:z-30 hover:-translate-y-0.5 hover:brightness-105 ${
            filter === "all" ? "-translate-y-1.5 bg-slate-600" : ""
          }`}
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4l-2 2h-4l-2-2H4"
            />
          </svg>
          <span className="mt-0.5 text-[9px] font-bold leading-none">
            {unassignedCount}
          </span>
        </button>

        {/* ที่คั่นรายสัปดาห์ — ซ้อนกันด้วย -ml, คลี่เมื่อ hover ทั้งแถบ */}
        {weekSummaries.map(({ week, count, colorKey }) => {
          const active = filter === week;
          return (
            <button
              key={week}
              onClick={() => onFilter(week)}
              title={`${week} · ${count} หัวข้อ`}
              style={{ clipPath: BOOKMARK_SHAPE, ...tagStyles(colorKey).solid }}
              className={`relative -ml-5 flex h-11 w-8 items-start justify-center pt-2 text-sm font-bold text-white transition-all duration-300 ease-out group-hover:ml-1 hover:z-30 hover:-translate-y-0.5 hover:brightness-105 ${
                active ? "z-20 -translate-y-1.5" : "z-10"
              }`}
            >
              {weekNumber(week)}
            </button>
          );
        })}

        {weekSummaries.length === 0 && (
          <span className="ml-2 mt-2 text-[10px] text-slate-300">
            ยังไม่มีสัปดาห์
          </span>
        )}
      </div>
    </div>
  );
}
