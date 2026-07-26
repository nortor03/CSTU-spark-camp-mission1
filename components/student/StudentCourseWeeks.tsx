"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import { resolveHex, weekNumber } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";
import { ChevronLeft } from "lucide-react";

interface WeekRow {
  week: string;
  count: number;
  colorKey: string;
}

/**
 * สัปดาห์/แบบทดสอบของวิชาที่นักเรียนเลือก
 * เห็นเฉพาะ "ชุดที่อาจารย์ตั้งเป็น active" ของแต่ละสัปดาห์ → กดเพื่อไปทำแบบทดสอบ
 */
export default function StudentCourseWeeks({ courseId }: { courseId: string }) {
  const { getCourse, setActiveCourse, activeCourseId, hydrated } = useCourse();
  const router = useRouter();
  const course = getCourse(courseId);

  // ตั้งวิชานี้เป็น active เพื่อให้หน้าทำแบบทดสอบทำงานกับวิชาที่ถูกต้อง
  useEffect(() => {
    if (course && activeCourseId !== courseId) setActiveCourse(courseId);
  }, [course, courseId, activeCourseId, setActiveCourse]);

  const rows = useMemo<WeekRow[]>(() => {
    if (!course) return [];
    return Object.entries(course.quizzes)
      .map<WeekRow | null>(([week, list]) => {
        const active = list.find((q) => q.isActive);
        if (!active) return null;
        return {
          week,
          count: active.questions.length,
          colorKey: course.weekConfig[week]?.colorKey ?? "red",
        };
      })
      .filter((r): r is WeekRow => r !== null)
      .sort((a, b) => Number(weekNumber(a.week)) - Number(weekNumber(b.week)));
  }, [course]);

  if (!hydrated) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  if (!course) {
    return (
      <div className="card-empty">
        <h2 className="display text-lg">ไม่พบรายวิชานี้</h2>
        <Link href="/student" className="btn-primary mt-5">
          ← กลับไปเลือกวิชา
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/student"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 transition hover:text-tu-red-600"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        รายวิชาของฉัน
      </Link>

      <PageHeader eyebrow="แบบทดสอบรายสัปดาห์" title={course.subject} tone="gold" />

      {rows.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีแบบทดสอบ</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            อาจารย์ยังไม่ได้เปิดแบบทดสอบของวิชานี้ กลับมาใหม่อีกครั้งภายหลัง
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-line-soft overflow-hidden">
          {rows.map((row) => (
            <button
              key={row.week}
              type="button"
              onClick={() => router.push(`/student/quiz/${weekNumber(row.week)}`)}
              className="group flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-paper-100/70 sm:px-5"
            >
              <div className="flex flex-shrink-0 items-center gap-3">
                <span
                  className="h-10 w-1 rounded-full"
                  style={{ backgroundColor: resolveHex(row.colorKey) }}
                  aria-hidden
                />
                <span className="w-7 text-2xl font-bold leading-none text-ink-300 transition group-hover:text-ink-500">
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
