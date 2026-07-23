"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCourse, type Course } from "@/lib/courseStore";
import PageHeader from "@/components/ui/PageHeader";

/**
 * หน้ารายงานชั้นเรียน (ระดับบนสุด) — เลือกวิชาก่อน
 * เพราะอาจารย์หนึ่งคนสอนได้หลายวิชา
 */
export default function ReportIndex() {
  const { courses, hydrated } = useCourse();

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
        eyebrow="เลือกวิชาที่ต้องการดูรายงาน"
        title="รายงานผลการเรียนรู้"
      />

      {courses.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีรายวิชา</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            สร้างรายวิชาและแบบทดสอบก่อน จึงจะมีรายงานให้ดู
          </p>
          <Link href="/course/new" className="btn-primary mt-5">
            + เพิ่มรายวิชาใหม่
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-line border-y border-line">
          {courses.map((c) => (
            <ReportCourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCourseCard({ course }: { course: Course }) {
  const quizWeeks = useMemo(
    () => Object.keys(course.quizzes).length,
    [course.quizzes],
  );

  return (
    <Link
      href={`/report/${course.id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 transition-colors hover:bg-paper-50 -mx-4 px-4 sm:-mx-6 sm:px-6"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h2 className="truncate text-lg font-semibold text-ink-900 group-hover:text-tu-red-600 transition-colors">
            {course.subject}
          </h2>
          <span className="rounded bg-paper-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
            รายวิชา
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-500">
          {quizWeeks > 0
            ? `${quizWeeks} สัปดาห์ที่มีแบบทดสอบ`
            : "ยังไม่มีแบบทดสอบ"}
        </p>
      </div>
      <span className="hidden sm:block shrink-0 text-ink-300 transition-colors group-hover:text-tu-red-500">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}
