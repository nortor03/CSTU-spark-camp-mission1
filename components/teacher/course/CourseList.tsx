"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCourse, type Course } from "@/lib/courseStore";
import { weekNumber } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";

/**
 * หน้าภาพรวมรายวิชา — สรุป "ทุกวิชา" ที่อาจารย์คนนี้สอน
 * กดการ์ดวิชาเพื่อเข้าไปดูรายละเอียดของวิชานั้น
 */
export default function CourseList() {
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
        eyebrow="หน้าแรก"
        title="รายวิชาทั้งหมด"
        action={
          courses.length > 0 ? (
            <Link href="/course/new" className="btn-primary">
              + เพิ่มรายวิชาใหม่
            </Link>
          ) : undefined
        }
      />

      {courses.length === 0 ? (
        <div className="card-empty">
          <p className="eyebrow">เริ่มต้นใช้งาน</p>
          <h2 className="display mt-1.5 text-xl">ยังไม่มีรายวิชา</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            สร้างรายวิชาแรกโดยกรอกชื่อวิชาและอัปโหลดสไลด์
            ระบบจะช่วยแยกหัวข้อการสอนให้อัตโนมัติ
          </p>
          <Link href="/course/new" className="btn-primary mt-5">
            + เพิ่มรายวิชาใหม่
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-line border-y border-line">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}

/** การ์ดสรุป 1 วิชา */
function CourseCard({ course }: { course: Course }) {
  const stats = useMemo(() => {
    const weeks = new Set(
      course.topics
        .filter((t) => t.weekAssigned)
        .map((t) => t.weekAssigned as string),
    );
    return {
      weeks: weeks.size,
      topics: course.topics.filter((t) => t.weekAssigned).length,
      quizzes: Object.keys(course.quizzes).length,
    };
  }, [course]);

  return (
    <Link
      href={`/course/${course.id}`}
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
      </div>

      <div className="flex items-center gap-6 sm:gap-10">
        <div className="flex items-center gap-6">
          <Stat value={stats.weeks} label="สัปดาห์" />
          <Stat value={stats.topics} label="หัวข้อ" />
          <Stat value={stats.quizzes} label="แบบทดสอบ" />
        </div>
        <span className="hidden sm:block text-ink-300 transition-colors group-hover:text-tu-red-500">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col sm:items-center">
      <span className="text-xl font-semibold text-ink-900">{value}</span>
      <span className="mt-0.5 text-[13px] text-ink-500">{label}</span>
    </div>
  );
}
