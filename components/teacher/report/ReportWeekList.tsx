"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useCourse } from "@/lib/courseStore";
import { buildClassReport } from "@/lib/analytics";
import { generateMockSubmissions } from "@/lib/mockClass";
import { resolveHex, weekNumber } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";

/** รายการสัปดาห์ที่มีแบบทดสอบของวิชาหนึ่ง พร้อมตัวเลขคร่าว ๆ */
export default function ReportWeekList({ courseId }: { courseId: string }) {
  const { getCourse, setActiveCourse, activeCourseId, hydrated } = useCourse();
  const course = getCourse(courseId);

  useEffect(() => {
    if (course && activeCourseId !== courseId) setActiveCourse(courseId);
  }, [course, courseId, activeCourseId, setActiveCourse]);

  const rows = useMemo(() => {
    if (!course) return [];
    return Object.entries(course.quizzes)
      .map(([week, quiz]) => {
        const all = [
          ...generateMockSubmissions(quiz),
          ...course.submissions.filter((s) => s.week === week),
        ];
        const report = buildClassReport(quiz, all);
        return {
          week,
          colorKey: course.weekConfig[week]?.colorKey ?? "red",
          questionCount: quiz.questions.length,
          report,
        };
      })
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
        <Link href="/report" className="btn-primary mt-5">
          ← กลับไปเลือกวิชา
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/report"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 transition hover:text-tu-red-600"
      >
        ← เลือกวิชาอื่น
      </Link>

      <PageHeader
        eyebrow="รายงานผล (ภาพรวม)"
        title="จุดอ่อนนักศึกษาในแต่ละสัปดาห์"
      />

      {rows.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีแบบทดสอบในวิชานี้</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            รายงานจะปรากฏเมื่อสร้างแบบทดสอบอย่างน้อยหนึ่งสัปดาห์
          </p>
          <Link href={`/course/${course.id}`} className="btn-primary mt-5">
            ไปสร้างแบบทดสอบ
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-line-soft overflow-hidden">
          {rows.map((row) => (
            <Link
              key={row.week}
              href={`/report/${course.id}/${weekNumber(row.week)}`}
              className="group flex items-center gap-4 px-4 py-4 transition hover:bg-paper-100/70 sm:px-5"
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
                <p className="mt-0.5 text-xs text-ink-500">
                  {row.report.studentCount} คน · เฉลี่ย {row.report.average}% ·{" "}
                  {row.questionCount} ข้อ
                </p>
              </div>

              <span className="flex-shrink-0 text-xs font-bold text-tu-red-600 transition group-hover:text-tu-red-700">
                ดูรายงาน →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
