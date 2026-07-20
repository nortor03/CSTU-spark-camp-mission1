"use client";

import type { WeekSummary } from "@/lib/useTopics";
import { resolveHex, weekNumber } from "@/lib/weeks";

/**
 * ตัวกรองรายสัปดาห์แบบแถบชิป
 * - ชิปแรก = หัวข้อที่ยังไม่ได้จัดกลุ่ม
 * - ชิปถัดไป = แต่ละสัปดาห์ พร้อมจุดสีประจำสัปดาห์และจำนวนหัวข้อ
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
  const chip =
    "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400 sm:block">
        ตัวกรอง
      </span>

      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-0.5">
        {/* ยังไม่จัดกลุ่ม */}
        <button
          onClick={() => onFilter("all")}
          className={`${chip} ${
            filter === "all"
              ? "border-ink-900 bg-ink-900 text-white"
              : "border-line bg-white text-ink-600 hover:border-line-strong"
          }`}
        >
          ยังไม่จัดกลุ่ม
          <span
            className={`rounded-full px-1.5 text-[10px] font-bold ${
              filter === "all"
                ? "bg-white/20 text-white"
                : "bg-paper-200 text-ink-600"
            }`}
          >
            {unassignedCount}
          </span>
        </button>

        {/* รายสัปดาห์ */}
        {weekSummaries.map(({ week, count, colorKey }) => {
          const active = filter === week;
          const hex = resolveHex(colorKey);
          return (
            <button
              key={week}
              onClick={() => onFilter(week)}
              title={`${week} · ${count} หัวข้อ`}
              style={
                active
                  ? { backgroundColor: hex, borderColor: hex, color: "#fff" }
                  : undefined
              }
              className={`${chip} ${
                active
                  ? ""
                  : "border-line bg-white text-ink-600 hover:border-line-strong"
              }`}
            >
              {!active && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: hex }}
                  aria-hidden
                />
              )}
              สัปดาห์ {weekNumber(week)}
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  active ? "bg-white/25" : "bg-paper-200 text-ink-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {weekSummaries.length === 0 && (
          <span className="flex-shrink-0 text-xs text-ink-400">
            ยังไม่มีสัปดาห์
          </span>
        )}
      </div>
    </div>
  );
}
