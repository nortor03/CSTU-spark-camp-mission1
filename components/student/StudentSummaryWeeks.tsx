"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCourse } from "@/lib/courseStore";
import { weekNumber, resolveHex } from "@/lib/weeks";
import { buildStudentSummary, type StudentSummary } from "@/lib/analytics";
import PageHeader from "@/components/ui/PageHeader";
import MasteryBar, { MasteryLegend } from "@/components/ui/MasteryBar";
import { ChevronDown, ChevronLeft } from "lucide-react";

interface WeekRow {
  week: string;
  summary: StudentSummary | null; // null = ยังไม่ได้ทำแบบทดสอบสัปดาห์นี้
}

/**
 * สรุปจุดแข็ง/จุดอ่อนของนักเรียน — เลือกวิชาแล้วมาหน้านี้
 * week accordion เหมือนหน้ารายวิชา แต่แต่ละสัปดาห์กางเห็น "สรุปจากควิซที่ทำ"
 * (สัปดาห์ที่ยังไม่ได้ทำ = ไม่มีสรุป · วิชาที่ไม่มีควิซเลย = ไม่มีอะไรให้สรุป)
 */
export default function StudentSummaryWeeks({ courseId }: { courseId: string }) {
  const { courses, getCourse, setActiveCourse, activeCourseId, studentId, hydrated } =
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
    // แสดงเฉพาะสัปดาห์ที่ "มีแบบทดสอบให้ทำ" (มีชุด active) — ไม่มีควิซ = ไม่มีอะไรสรุป
    return Object.entries(course.quizzes)
      .map<WeekRow | null>(([week, list]) => {
        const active = list.find((q) => q.isActive);
        if (!active) return null;

        // ผลล่าสุดของนักเรียนคนนี้ในสัปดาห์นี้
        const mine = course.submissions
          .filter(
            (s) =>
              s.week === week && (s.isCurrentUser || s.studentId === studentId),
          )
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

        // เลือกควิซชุดที่ตรงกับรุ่นที่ทำ (ถ้าไม่เจอใช้ชุด active)
        const quiz =
          (mine && list.find((q) => q.revision === mine.quizRevision)) ?? active;

        return {
          week,
          summary: mine ? buildStudentSummary(quiz, mine.answers) : null,
        };
      })
      .filter((r): r is WeekRow => r !== null)
      .sort((a, b) => Number(weekNumber(a.week)) - Number(weekNumber(b.week)));
  }, [course, studentId]);

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
        <Link href="/student/summary" className="btn-primary mt-5">
          ← กลับไปเลือกวิชา
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/student/summary"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 transition hover:text-tu-red-600"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        สรุปผลของฉัน
        {courses.length > 1 && (
          <span className="text-ink-400"> (เลือกวิชา)</span>
        )}
      </Link>

      <PageHeader eyebrow="จุดแข็ง / จุดอ่อน" title={course.subject} tone="gold" />

      {rows.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีสรุป</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            วิชานี้ยังไม่มีแบบทดสอบให้ทำ เมื่อทำแบบทดสอบแล้ว
            ระบบจะสรุปจุดแข็ง/จุดอ่อนให้ที่นี่
          </p>
        </div>
      ) : (
        <div className="border-t border-line-soft">
          {rows.map((row) => {
            const wk = weekNumber(row.week);
            const open = expandedWeeks.has(row.week);
            const done = row.summary !== null;
            const hex = resolveHex(course.weekConfig?.[row.week]?.colorKey);

            return (
              <div key={row.week} className="border-b border-line-soft">
                <button
                  type="button"
                  onClick={() => toggleWeek(row.week)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-5 py-5 text-left"
                >
                  <div className="flex-shrink-0">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-300">
                      Week
                    </span>
                    <span
                      className="block text-[42px] font-bold leading-[0.8] tabular-nums"
                      style={{ color: hex, opacity: done ? 1 : 0.5 }}
                    >
                      {wk.padStart(2, "0")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {done && row.summary ? (
                      <>
                        <p className="text-[15px] font-semibold leading-snug text-ink-900">
                          ทำได้ {row.summary.score}/{row.summary.total} ข้อ (
                          {row.summary.percent}%)
                        </p>
                        <p className="mt-1 max-w-[54ch] text-xs text-ink-400">
                          {row.summary.headline}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[15px] font-semibold leading-snug text-ink-500">
                          ยังไม่ได้ทำแบบทดสอบสัปดาห์นี้
                        </p>
                        <p className="mt-1 text-xs text-ink-400">
                          ทำแบบทดสอบก่อน จึงจะมีสรุปจุดแข็ง/จุดอ่อน
                        </p>
                      </>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>

                {open && (
                  <div className="ml-0 pb-6 sm:ml-[76px]">
                    {row.summary ? (
                      <div className="flex flex-col gap-5">
                        {/* ความเข้าใจรายหัวข้อ */}
                        <section>
                          <h4
                            className="mb-2 text-[11px] font-bold uppercase tracking-wide"
                            style={{ color: hex }}
                          >
                            ความเข้าใจรายหัวข้อ
                          </h4>
                          <div className="divide-y divide-line-soft rounded-xl border border-line bg-paper-50 px-4">
                            {row.summary.topics.map((t) => (
                              <MasteryBar key={t.topic} item={t} />
                            ))}
                          </div>
                          <div className="mt-3">
                            <MasteryLegend />
                          </div>
                        </section>

                        {/* ข้อเสนอแนะ */}
                        <section>
                          <h4
                            className="mb-2 text-[11px] font-bold uppercase tracking-wide"
                            style={{ color: hex }}
                          >
                            ข้อเสนอแนะ
                          </h4>
                          <ul className="flex flex-col gap-2">
                            {row.summary.nextSteps.map((s, i) => (
                              <li
                                key={i}
                                className="flex gap-2.5 text-[13px] leading-relaxed text-ink-700"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-tu-gold-500" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </section>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-line-strong bg-paper-50 px-4 py-5 text-center">
                        <p className="text-sm text-ink-500">
                          ยังไม่ได้ทำแบบทดสอบสัปดาห์นี้
                        </p>
                        <Link
                          href={`/student/quiz/${wk}`}
                          className="btn-primary mt-3 px-4 py-2 text-xs"
                        >
                          ไปทำแบบทดสอบ →
                        </Link>
                      </div>
                    )}
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
