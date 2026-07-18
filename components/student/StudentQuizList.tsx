"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCourse } from "@/lib/courseStore";
import { resolveHex, weekNumber } from "@/lib/weeks";

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
      <div className="grid place-items-center py-24 text-sm text-slate-400">
        กำลังโหลด…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* หัวเรื่อง */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-tu-red-500">
          แบบทดสอบ
        </p>
        <h1 className="mt-0.5 text-2xl font-bold text-slate-800">
          {subject || "แบบทดสอบรายสัปดาห์"}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          เลือกสัปดาห์ที่ต้องการทำแบบทดสอบ ทำเสร็จจะได้รับผลและคำแนะนำจาก AI
        </p>
      </div>

      {/* รายการสัปดาห์ */}
      {rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-600">
            ยังไม่มีแบบทดสอบ
          </p>
          <p className="mt-1 text-xs text-slate-400">
            อาจารย์ยังไม่ได้สร้างแบบทดสอบ กลับมาใหม่อีกครั้งภายหลัง
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100 bg-white">
          {rows.map((row) => (
            <Link
              key={row.week}
              href={`/student/quiz/${weekNumber(row.week)}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/60"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: resolveHex(row.colorKey) }}
                />
                <span className="text-sm font-bold text-slate-700">
                  {row.week}
                </span>
                <span className="text-[11px] text-slate-400">
                  {row.count} ข้อ
                </span>
              </div>
              <span className="shrink-0 text-xs font-bold text-tu-red-600">
                เริ่มทำ →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
