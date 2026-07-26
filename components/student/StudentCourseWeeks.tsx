"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCourse } from "@/lib/courseStore";
import { weekNumber, resolveHex } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";
import { ChevronDown, ChevronLeft, FileText } from "lucide-react";
import type { Quiz } from "@/lib/quiz";

interface WeekRow {
  week: string;
  topics: string[];
  activeQuiz: Quiz | null;
}

/**
 * หน้ารายละเอียดวิชาฝั่งนักเรียน — หน้าตาคล้ายของอาจารย์ (WEEK + accordion)
 * แต่ read-only: interact ได้แค่ "กล่องสัปดาห์" (กางดูแบบทดสอบที่อาจารย์เปิดไว้ → เริ่มทำ)
 * ไม่มีปุ่มของอาจารย์ (อัปโหลด/จัดหัวข้อ/แก้ไข/ลบ/เลือกชุด)
 */
export default function StudentCourseWeeks({ courseId }: { courseId: string }) {
  const { courses, getCourse, setActiveCourse, activeCourseId, hydrated } =
    useCourse();
  const course = getCourse(courseId);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (course && activeCourseId !== courseId) setActiveCourse(courseId);
  }, [course, courseId, activeCourseId, setActiveCourse]);

  function toggleWeek(week: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  }

  const rows = useMemo<WeekRow[]>(() => {
    if (!course) return [];
    // รวมสัปดาห์จาก "หัวข้อที่จัดแล้ว" + "สัปดาห์ที่มีควิซ" กันไม่ให้ควิซหลุด
    const weeks = new Set<string>();
    for (const t of course.topics) if (t.weekAssigned) weeks.add(t.weekAssigned);
    for (const w of Object.keys(course.quizzes)) weeks.add(w);

    return Array.from(weeks)
      .map((week) => ({
        week,
        topics: course.topics
          .filter((t) => t.weekAssigned === week)
          .map((t) => t.title),
        activeQuiz: (course.quizzes[week] ?? []).find((q) => q.isActive) ?? null,
      }))
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
      {/* breadcrumb */}
      <Link
        href="/student"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 transition hover:text-tu-red-600"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        รายวิชาทั้งหมด
        {courses.length > 1 && (
          <span className="text-ink-400"> ({courses.length} วิชา)</span>
        )}
      </Link>

      <PageHeader eyebrow="รายละเอียดรายวิชา" title={course.subject} />

      {/* syllabus — แสดงอย่างเดียว (ไม่มีปุ่มให้กด) */}
      {course.syllabusName && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-line bg-paper-50 px-4 py-3">
          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-tu-red-50 text-tu-red-600">
            <FileText className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Course Syllabus
              {course.courseCode && (
                <span className="ml-1.5 normal-case text-ink-500">
                  · {course.courseCode}
                </span>
              )}
            </p>
            <p className="truncate text-sm font-medium text-ink-700">
              {course.syllabusName}
            </p>
          </div>
        </div>
      )}

      {/* รายการสัปดาห์ */}
      {rows.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีแบบทดสอบ</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            อาจารย์ยังไม่ได้เปิดแบบทดสอบของวิชานี้ กลับมาใหม่อีกครั้งภายหลัง
          </p>
        </div>
      ) : (
        <div className="border-t border-line-soft">
          {rows.map((row) => {
            const wk = weekNumber(row.week);
            const open = expandedWeeks.has(row.week);
            const hasQuiz = row.activeQuiz !== null;
            const hex = resolveHex(course.weekConfig?.[row.week]?.colorKey);

            const WeekNum = (
              <div className="flex-shrink-0">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-300">
                  Week
                </span>
                <span
                  className="block text-[42px] font-bold leading-[0.8] tabular-nums"
                  style={{ color: hex, opacity: hasQuiz ? 1 : 0.5 }}
                >
                  {wk.padStart(2, "0")}
                </span>
              </div>
            );

            const WeekInfo = (
              <div className="min-w-0 flex-1">
                <p className="max-w-[54ch] text-[15px] font-semibold leading-snug text-ink-900">
                  {row.topics.length > 0
                    ? row.topics.join("  ·  ")
                    : "ไม่มีรายละเอียดหัวข้อ"}
                </p>
                <p className="mt-1 text-xs text-ink-400">
                  {hasQuiz ? "1 แบบทดสอบ" : "ยังไม่มีแบบทดสอบ"}
                </p>
              </div>
            );

            return (
              <div key={row.week} className="border-b border-line-soft">
                {hasQuiz ? (
                  <button
                    type="button"
                    onClick={() => toggleWeek(row.week)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-5 py-5 text-left"
                  >
                    {WeekNum}
                    {WeekInfo}
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                ) : (
                  /* สัปดาห์ที่ยังไม่มีแบบทดสอบ — แสดงเฉย ๆ กดไม่ได้ */
                  <div className="flex w-full items-center gap-5 py-5">
                    {WeekNum}
                    {WeekInfo}
                    <span className="flex-shrink-0 text-xs text-ink-300">
                      ยังไม่เปิด
                    </span>
                  </div>
                )}

                {open && row.activeQuiz && (
                  <div className="ml-0 pb-6 sm:ml-[76px]">
                    <div
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper-50 px-4 py-3.5"
                      style={{ borderLeft: `3px solid ${hex}` }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-800">
                          {row.activeQuiz.title}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-400">
                          {row.activeQuiz.questions.length} ข้อ
                        </p>
                      </div>
                      <Link
                        href={`/student/quiz/${wk}`}
                        className="btn-primary flex-shrink-0 px-4 py-2 text-xs"
                      >
                        เริ่มทำ →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
