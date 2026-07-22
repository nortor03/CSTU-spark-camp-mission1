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
        <div className="grid gap-4 sm:grid-cols-2">
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
      className="card group flex items-center justify-between gap-3 p-5 transition hover:shadow-lift sm:p-6"
    >
      <div className="min-w-0">
        <p className="eyebrow">รายวิชา</p>
        <h2 className="display mt-1 truncate text-xl">{course.subject}</h2>
        <p className="mt-2 text-xs text-ink-500">
          {quizWeeks > 0
            ? `${quizWeeks} สัปดาห์ที่มีแบบทดสอบ`
            : "ยังไม่มีแบบทดสอบ"}
        </p>
      </div>
      <span
        className="flex-shrink-0 text-tu-red-300 transition group-hover:text-tu-red-500"
        aria-hidden
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}
