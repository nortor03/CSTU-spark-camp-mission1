"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCourse } from "@/lib/courseStore";
import PageHeader from "@/components/ui/PageHeader";
import { ChevronRight } from "lucide-react";

/**
 * หน้าแรกฝั่งนักเรียน — เลือกรายวิชาก่อน (นักเรียนอาจลงเรียนหลายวิชา)
 * เลือกวิชาแล้วจึงไปดูสัปดาห์/แบบทดสอบของวิชานั้น
 */
export default function StudentCourseSelect() {
  const { courses, hydrated } = useCourse();

  // นับจำนวนสัปดาห์ที่มีแบบทดสอบ "ชุดที่ใช้งาน" ของแต่ละวิชา
  const items = useMemo(
    () =>
      courses.map((c) => ({
        id: c.id,
        subject: c.subject,
        quizWeeks: Object.values(c.quizzes).filter((list) =>
          list.some((q) => q.isActive),
        ).length,
      })),
    [courses],
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
      <PageHeader eyebrow="เลือกวิชาที่ต้องการทำแบบทดสอบ" title="รายวิชาของฉัน" tone="gold" />

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
            <Link
              key={c.id}
              href={`/student/course/${c.id}`}
              className="group -mx-4 flex items-center justify-between gap-4 px-4 py-5 transition-colors hover:bg-paper-50 sm:-mx-6 sm:px-6"
            >
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-ink-900 transition-colors group-hover:text-tu-red-600">
                  {c.subject}
                </h2>
                <p className="mt-0.5 text-sm text-ink-500">
                  {c.quizWeeks > 0
                    ? `${c.quizWeeks} สัปดาห์ที่มีแบบทดสอบ`
                    : "ยังไม่มีแบบทดสอบ"}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-ink-300 transition group-hover:translate-x-1 group-hover:text-tu-red-500" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
