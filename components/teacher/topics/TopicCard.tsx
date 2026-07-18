"use client";

import type { Topic } from "@/lib/types";
import { resolveHex } from "@/lib/weeks";

/** การ์ดหัวข้อ 1 ใบใน grid — เลือกได้ / แก้ชื่อได้ */
export default function TopicCard({
  topic,
  showWeekBadge,
  weekColorKey,
  onToggleSelect,
  onEdit,
  onUnassign,
}: {
  topic: Topic;
  showWeekBadge: boolean;
  weekColorKey?: string;
  onToggleSelect: (id: string) => void;
  onEdit: (topic: Topic) => void;
  onUnassign: (id: string) => void;
}) {
  const base =
    "group relative flex select-none flex-col justify-between rounded-2xl border p-4 transition";
  const state = topic.selected
    ? "border-tu-red-400 bg-tu-red-50/50"
    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/60";

  return (
    <div
      className={`${base} ${state} cursor-pointer`}
      onClick={() => onToggleSelect(topic.id)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          {topic.aiGenerated ? (
            <span className="text-[10px] font-bold text-tu-gold-600">
AI แนะนำ
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-600">
              ✓ แก้ไขแล้ว
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(topic);
            }}
            className="rounded-lg p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-tu-red-600 group-hover:opacity-100"
            aria-label="แก้ไขชื่อหัวข้อ"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </div>

        <h4 className="text-sm font-bold leading-snug text-slate-800">
          {topic.title}
        </h4>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1 text-xs text-slate-400">
          <svg
            className="h-3 w-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <span className="truncate font-mono">{topic.file}</span>
        </p>

        {showWeekBadge && topic.weekAssigned && (
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: resolveHex(weekColorKey) }}
              />
              {topic.weekAssigned}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUnassign(topic.id);
              }}
              className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-tu-red-600"
            >
              นำออก
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
