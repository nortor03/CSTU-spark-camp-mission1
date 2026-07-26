"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useCourse } from "@/lib/courseStore";
import {
  buildStudentSummary,
  LEVEL_META,
  type Submission,
} from "@/lib/analytics";
import { generateMockSubmissions } from "@/lib/mockClass";
import { weekNumber } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";
import { ChevronLeft } from "lucide-react";

/**
 * รายงานผลรายบุคคล (ฝั่งอาจารย์) — เลือกนักเรียน 1 คนจากตารางรายคน
 * แล้วดูว่าตอบผิดข้อไหน จุดอ่อนรายหัวข้อ และข้อเสนอแนะ
 */
export default function StudentReport({
  courseId,
  week,
  studentId,
}: {
  courseId: string;
  week: string;
  studentId: string;
}) {
  const { getCourse, setActiveCourse, activeCourseId, hydrated } = useCourse();
  const course = getCourse(courseId);
  const weekQuizzes = course?.quizzes[week];
  const quiz = weekQuizzes?.find((q) => q.isActive) ?? weekQuizzes?.[0];

  useEffect(() => {
    if (course && activeCourseId !== courseId) setActiveCourse(courseId);
  }, [course, courseId, activeCourseId, setActiveCourse]);

  // submission ของนักเรียนคนนี้ — mock (deterministic) + ผลจริง แล้วหาให้ตรง id
  const submission = useMemo<Submission | undefined>(() => {
    if (!quiz || !course) return undefined;
    const all = [
      ...generateMockSubmissions(quiz),
      ...course.submissions.filter((s) => s.week === week),
    ];
    return all.find((s) => s.studentId === studentId);
  }, [quiz, course, week, studentId]);

  const summary = useMemo(
    () => (quiz && submission ? buildStudentSummary(quiz, submission.answers) : null),
    [quiz, submission],
  );

  const backHref = `/report/${courseId}/${weekNumber(week)}`;

  if (!hydrated) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  if (!quiz || !submission || !summary) {
    return (
      <div className="card-empty">
        <h2 className="display text-lg">ไม่พบผลของนักเรียนคนนี้</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
          อาจยังไม่ได้ทำแบบทดสอบของ{week} หรือลิงก์ไม่ถูกต้อง
        </p>
        <Link href={backHref} className="btn-primary mt-5">
          ← กลับไปรายงานทั้งชั้น
        </Link>
      </div>
    );
  }

  const wrong = summary.misconceptions;

  return (
    <div>
      <Link
        href={backHref}
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 transition hover:text-tu-red-600"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        รายงานทั้งชั้น · {week}
      </Link>

      <PageHeader eyebrow="ผลรายบุคคล" title={submission.studentName} />

      {/* สรุปคะแนน */}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-line bg-paper-50 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            รหัสนักศึกษา
          </p>
          <p className="text-sm font-semibold tabular-nums text-ink-800">
            {submission.studentId}
          </p>
        </div>
        <div className="h-8 w-px bg-line" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            คะแนน
          </p>
          <p className="text-sm font-bold text-ink-900">
            {summary.score}/{summary.total}{" "}
            <span className="font-semibold text-tu-red-600">
              ({summary.percent}%)
            </span>
          </p>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-ink-600 sm:ml-2">
          {summary.headline}
        </p>
      </div>

      {/* จุดอ่อนรายหัวข้อ */}
      <section className="card mb-6 p-5 sm:p-6">
        <h2 className="display text-lg">จุดอ่อนรายหัวข้อ</h2>
        <hr className="rule-gold my-4" />
        <div className="flex flex-col gap-3">
          {summary.topics.map((t) => {
            const meta = LEVEL_META[t.level];
            return (
              <div key={t.topic} className="flex items-center gap-3">
                <span
                  className="w-24 flex-shrink-0 text-xs font-bold"
                  style={{ color: meta.hex }}
                  title={meta.label}
                >
                  {meta.icon} {meta.label}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-700">
                  {t.topic}
                </span>
                <span className="h-1.5 w-28 flex-shrink-0 overflow-hidden rounded-full bg-paper-300">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${t.percent}%`, backgroundColor: meta.hex }}
                  />
                </span>
                <span className="w-16 flex-shrink-0 text-right text-xs tabular-nums text-ink-500">
                  {t.correct}/{t.total}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ข้อที่ตอบผิด */}
      <section className="card mb-6 p-5 sm:p-6">
        <h2 className="display text-lg">
          ข้อที่ตอบผิด{" "}
          <span className="text-sm font-normal text-ink-400">
            ({wrong.length} ข้อ)
          </span>
        </h2>
        <hr className="rule-gold my-4" />
        {wrong.length === 0 ? (
          <p className="text-sm text-ink-500">ตอบถูกทุกข้อ 🎉</p>
        ) : (
          <div className="flex flex-col gap-4">
            {wrong.map((m, i) => (
              <div
                key={i}
                className="rounded-xl border border-line bg-white p-4"
              >
                <div className="mb-3 flex items-start gap-2">
                  <span className="text-sm font-bold text-ink-400">{i + 1}.</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug text-ink-800">
                      {m.question}
                    </p>
                    <span className="mt-1 inline-block rounded bg-paper-200 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
                      {m.topic}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 pl-6">
                  <p className="flex items-center gap-2 rounded-lg bg-tu-red-50 px-3 py-2 text-sm text-tu-red-700 ring-1 ring-tu-red-100">
                    <span className="font-bold">✕</span>
                    <span className="font-medium">คำตอบที่เลือก:</span>
                    {m.chosenText}
                  </p>
                  <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    <span className="font-bold">✓</span>
                    <span className="font-medium">คำตอบที่ถูก:</span>
                    {m.correctText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ข้อเสนอแนะ */}
      <section className="card p-5 sm:p-6">
        <h2 className="display text-lg">ข้อเสนอแนะสำหรับนักศึกษาคนนี้</h2>
        <hr className="rule-gold my-4" />
        <ul className="flex flex-col gap-2.5">
          {summary.nextSteps.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-700">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-tu-gold-500" />
              {s}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
