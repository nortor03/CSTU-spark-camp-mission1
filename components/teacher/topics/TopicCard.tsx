"use client";

import type { Topic } from "@/lib/types";
import type { SyllabusClo } from "@/lib/syllabus";
import { resolveHex, tagStyles, weekNumber } from "@/lib/weeks";

/**
 * แถวหัวข้อ 1 รายการ — เลือกได้ / แก้ชื่อได้
 * ออกแบบเป็นรายการแนวนอน (ไม่ใช่การ์ดกริด) เพราะหัวข้อจริงจาก syllabus
 * มักเป็นประโยคยาว บีบใส่การ์ดสามคอลัมน์แล้วอ่านยาก
 */
export default function TopicCard({
  topic,
  showWeekBadge,
  weekColorKey,
  clos,
  onToggleSelect,
  onEdit,
  onUnassign,
  draggable = false,
  isDragging = false,
  isDropTarget = false,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  onDropOn,
}: {
  topic: Topic;
  showWeekBadge: boolean;
  weekColorKey?: string;
  /** CLO ของวิชานี้ — ใช้หาคำอธิบายเต็มมาโชว์เป็น tooltip บนป้าย CLO */
  clos: SyllabusClo[];
  onToggleSelect: (id: string) => void;
  onEdit: (topic: Topic) => void;
  onUnassign: (id: string) => void;
  /** ลากสลับตำแหน่งได้ไหม — เปิดเฉพาะมุมมอง "ทั้งหมด" */
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOverCard?: () => void;
  onDropOn?: () => void;
}) {
  const hasWeek = showWeekBadge && !!topic.weekAssigned;
  const hex = hasWeek ? resolveHex(weekColorKey) : undefined;

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
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={() => onDragEnd?.()}
      onDragOver={(e) => {
        if (!draggable) return;
        e.preventDefault();
        onDragOverCard?.();
      }}
      onDrop={(e) => {
        if (!draggable) return;
        e.preventDefault();
        onDropOn?.();
      }}
      className={`group flex select-none items-center gap-3 px-4 py-3.5 transition sm:gap-4 sm:px-5 ${
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${isDragging ? "opacity-40" : ""} ${
        isDropTarget
          ? "bg-tu-red-50 ring-2 ring-inset ring-tu-red-400"
          : topic.selected
            ? "bg-tu-red-50"
            : "hover:bg-paper-100/70"
      }`}
    >
      {/* จับลากสลับสัปดาห์ */}
      {draggable && (
        <span
          className="flex-shrink-0 text-ink-300"
          aria-hidden
          title="ลากเพื่อสลับสัปดาห์"
        >
          <GripIcon />
        </span>
      )}

      {/* เช็คบ็อกซ์เลือก */}
      <span
        className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-2 transition ${
          topic.selected
            ? "border-tu-red-500 bg-tu-red-500 text-white"
            : "border-line-strong text-transparent group-hover:border-tu-red-300"
        }`}
        aria-hidden
      >
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

      {/* แถบสี + เลขสัปดาห์ */}
      <div className="flex flex-shrink-0 items-center gap-2.5">
        <span
          className="h-8 w-1 rounded-full sm:h-9"
          style={{ backgroundColor: hex ?? "#E8DED0" }}
          aria-hidden
        />
        <span className="display w-6 text-lg leading-none text-ink-300 sm:text-xl">
          {hasWeek ? weekNumber(topic.weekAssigned as string) : "–"}
        </span>
      </div>

      {/* เนื้อหาหลัก */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {topic.aiGenerated ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-tu-gold-50 px-2 py-0.5 text-[10px] font-bold leading-4 text-tu-gold-700 ring-1 ring-tu-gold-200">
              <SparkIcon />
              AI แนะนำ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold leading-4 text-emerald-700 ring-1 ring-emerald-200">
              ✓ แก้ไขแล้ว
            </span>
          )}
          {hasWeek && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-4"
              style={tagStyles(weekColorKey).soft}
            >
              {topic.weekAssigned}
            </span>
          )}
          {topic.relatedClos?.map((code) => (
            <span
              key={code}
              title={clos.find((c) => c.code === code)?.description ?? undefined}
              className="inline-flex items-center rounded-full bg-paper-200 px-2 py-0.5 text-[10px] font-bold leading-4 text-ink-600 ring-1 ring-line-strong"
            >
              {code}
            </span>
          ))}
        </div>

        <h4 className="display mt-1.5 text-base leading-normal text-ink-900 sm:text-[17px]">
          {topic.title}
        </h4>
      </div>

      {/* ปุ่มแก้ไข/นำออก — เห็นตลอด (จาง) ให้กดได้แม้บนจอสัมผัสที่ไม่มี hover */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(topic);
          }}
          className="rounded-md p-2 text-ink-300 transition hover:bg-paper-200 hover:text-tu-red-600"
          aria-label="แก้ไขชื่อหัวข้อ"
        >
          <EditIcon />
        </button>
        {hasWeek && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnassign(topic.id);
            }}
            className="rounded-md px-2 py-1.5 text-[11px] font-semibold text-ink-300 transition hover:bg-tu-red-50 hover:text-tu-red-600"
          >
            นำออก
          </button>
        )}
      </div>
    </div>
  );
}

function GripIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l1.9 5.7L19.6 9l-4.5 3.3 1.7 5.7L12 14.7 7.2 18l1.7-5.7L4.4 9l5.7-1.3L12 2z" />
    </svg>
  );
}

function EditIcon() {
  return (
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
  );
}
