"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useCourse } from "@/lib/courseStore";
import PageHeader from "@/components/ui/PageHeader";
import { ChevronRight } from "lucide-react";

/**
 * หน้าแรกของเมนู "จุดแข็ง/จุดอ่อน" — เลือกวิชาก่อน (flow เดียวกับหน้ารายวิชา)
 * เลือกวิชาแล้วจึงไปดูสรุปรายสัปดาห์จากควิซที่ทำ
 */
export default function StudentSummarySelect() {
  const router = useRouter();
  const { courses, studentId, hydrated, setActiveCourse } = useCourse();

  const items = useMemo(
    () =>
      courses.map((c) => {
        // จำนวนสัปดาห์ที่นักเรียนคนนี้ทำแบบทดสอบแล้ว
        const doneWeeks = new Set(
          c.submissions
            .filter((s) => s.isCurrentUser || s.studentId === studentId)
            .map((s) => s.week),
        );
        return { id: c.id, subject: c.subject, done: doneWeeks.size };
      }),
    [courses, studentId],
  );

  if (!hydrated) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="ดูจุดแข็ง / จุดอ่อนของตัวเอง"
        title="สรุปผลของฉัน"
        tone="gold"
      />

      {items.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีรายวิชา</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            อาจารย์ยังไม่ได้เปิดรายวิชา กลับมาใหม่อีกครั้งภายหลัง
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-line border-y border-line">
          {items.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveCourse(c.id);
                router.push("/student/summary/1");
              }}
              className="group -mx-4 flex w-full text-left items-center justify-between gap-4 px-4 py-5 transition-colors hover:bg-paper-50 sm:-mx-6 sm:px-6"
            >
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-ink-900 transition-colors group-hover:text-tu-red-600">
                  {c.subject}
                </h2>
                <p className="mt-0.5 text-sm text-ink-500">
                  {c.done > 0
                    ? `ทำแบบทดสอบแล้ว ${c.done} สัปดาห์`
                    : "ยังไม่ได้ทำแบบทดสอบ"}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-ink-300 transition group-hover:translate-x-1 group-hover:text-tu-red-500" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
