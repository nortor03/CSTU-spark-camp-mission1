"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCourse } from "@/lib/courseStore";
import { resolveHex, weekNumber } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";

/**
 * หน้ารายการแบบทดสอบสำหรับนักเรียน
 * โชว์เฉพาะสัปดาห์ที่อาจารย์สร้างแบบทดสอบไว้แล้ว (จาก store เดียวกัน)
 */
export default function StudentQuizList() {
  const { subject, quizzes, weekConfig, hydrated } = useCourse();

  const rows = useMemo(
    () =>
      Object.entries(quizzes)
        .map(([week, quiz]) => ({
          week,
          count: quiz.questions.length,
          colorKey: weekConfig[week]?.colorKey ?? "red",
        }))
        .sort((a, b) => Number(weekNumber(a.week)) - Number(weekNumber(b.week))),
    [quizzes, weekConfig],
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
        eyebrow="แบบทดสอบรายสัปดาห์"
        title={subject || "แบบทดสอบรายสัปดาห์"}
        subtitle="เลือกสัปดาห์ที่ต้องการทำแบบทดสอบ เมื่อทำเสร็จจะได้รับคะแนนพร้อมคำแนะนำจาก AI ทันที"
        tone="gold"
      />

      {/* รายการสัปดาห์ */}
      {rows.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีแบบทดสอบ</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            อาจารย์ยังไม่ได้สร้างแบบทดสอบ กลับมาใหม่อีกครั้งภายหลัง
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-line-soft overflow-hidden">
          {rows.map((row) => (
            <Link
              key={row.week}
              href={`/student/quiz/${weekNumber(row.week)}`}
              className="group flex items-center gap-4 px-4 py-4 transition hover:bg-paper-100/70 sm:px-5"
            >
              <div className="flex flex-shrink-0 items-center gap-3">
                <span
                  className="h-10 w-1 rounded-full"
                  style={{ backgroundColor: resolveHex(row.colorKey) }}
                  aria-hidden
                />
                <span className="display w-7 text-2xl leading-none text-ink-300 transition group-hover:text-ink-500">
                  {weekNumber(row.week)}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink-800">{row.week}</p>
                <p className="mt-0.5 text-xs text-ink-500">{row.count} ข้อ</p>
              </div>

              <span className="flex-shrink-0 text-xs font-bold text-tu-red-600 transition group-hover:text-tu-red-700">
                เริ่มทำ →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
