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
  const state = topic.selected
    ? "border-tu-red-400 bg-tu-red-50 shadow-card"
    : "border-line bg-white hover:border-line-strong hover:shadow-card";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={topic.selected}
      onClick={() => onToggleSelect(topic.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleSelect(topic.id);
        }
      }}
      className={`group relative flex cursor-pointer select-none flex-col justify-between rounded-lg border p-4 transition ${state}`}
    >
      {/* เครื่องหมายถูกมุมขวาบนเมื่อถูกเลือก */}
      {topic.selected && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-tu-red-500 text-white shadow-card">
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          {topic.aiGenerated ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-tu-gold-50 px-2 py-0.5 text-[10px] font-bold text-tu-gold-700 ring-1 ring-tu-gold-200">
              <SparkIcon />
              AI แนะนำ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              ✓ แก้ไขแล้ว
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(topic);
            }}
            className="rounded-md p-1 text-ink-400 opacity-0 transition hover:bg-paper-200 hover:text-tu-red-600 focus-visible:opacity-100 group-hover:opacity-100"
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

        <h4 className="display text-[15px] leading-snug">{topic.title}</h4>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
        <p className="flex min-w-0 items-center gap-1 text-[11px] text-ink-400">
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
          <span className="truncate">{topic.file}</span>
        </p>

        {showWeekBadge && topic.weekAssigned && (
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-ink-600">
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
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-ink-400 transition hover:bg-tu-red-50 hover:text-tu-red-600"
            >
              นำออก
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l1.9 5.7L19.6 9l-4.5 3.3 1.7 5.7L12 14.7 7.2 18l1.7-5.7L4.4 9l5.7-1.3L12 2z" />
    </svg>
  );
}
