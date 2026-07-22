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
        <div className="grid gap-4 sm:grid-cols-2">
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
      className="card group flex flex-col p-5 transition hover:shadow-lift sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">รายวิชา</p>
          <h2 className="display mt-1 truncate text-xl">{course.subject}</h2>
        </div>
        <span
          className="mt-1 flex-shrink-0 text-tu-red-300 transition group-hover:text-tu-red-500"
          aria-hidden
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      </div>

      <hr className="rule-gold my-4" />

      <div className="mt-auto grid grid-cols-3 gap-2 text-center">
        <Stat value={stats.weeks} label="สัปดาห์" />
        <Stat value={stats.topics} label="หัวข้อ" />
        <Stat value={stats.quizzes} label="แบบทดสอบ" />
      </div>
    </Link>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-paper-50 py-2.5">
      <p className="text-xl font-bold leading-none text-ink-900">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-ink-500">{label}</p>
    </div>
  );
}
