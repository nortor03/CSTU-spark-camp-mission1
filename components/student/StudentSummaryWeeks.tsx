"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCourse } from "@/lib/courseStore";
import { weekNumber, resolveHex } from "@/lib/weeks";
import { buildStudentSummary, type StudentSummary } from "@/lib/analytics";
import { gradeQuiz } from "@/lib/feedback";
import {
  getPracticeHistory,
  type PracticeAttempt,
} from "@/lib/practiceHistory";
import PageHeader from "@/components/ui/PageHeader";
import MasteryBar, { MasteryLegend } from "@/components/ui/MasteryBar";
import Modal, { ModalHeader } from "@/components/ui/Modal";
import { ChevronDown, ChevronLeft, History } from "lucide-react";

interface WeekRow {
  week: string;
  summary: StudentSummary | null; // null = ยังไม่ได้ทำแบบทดสอบสัปดาห์นี้
}

/**
 * สรุปจุดแข็ง/จุดอ่อนของนักเรียน — เลือกวิชาแล้วมาหน้านี้
 * week accordion: แต่ละสัปดาห์กางเห็นข้อมูลชุดเดียวกับหน้าสรุปรายสัปดาห์
 * (KPI · ความเข้าใจรายหัวข้อ · จุดที่คลาดเคลื่อน · คำแนะนำ) + ปุ่มทำแบบทดสอบซ้ำ
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
    return Object.entries(course.quizzes)
      .map<WeekRow | null>(([week, list]) => {
        const active = list.find((q) => q.isActive);
        if (!active) return null;
        const mine = course.submissions
          .filter(
            (s) =>
              s.week === week && (s.isCurrentUser || s.studentId === studentId),
          )
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
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
        {courses.length > 1 && <span className="text-ink-400"> (เลือกวิชา)</span>}
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
            const s = row.summary;
            const done = s !== null;
            const hex = resolveHex(course.weekConfig?.[row.week]?.colorKey);

            return (
              <div key={row.week} className="border-b border-line-soft">
                {/* หัวสัปดาห์ — กดกาง/พับ + ปุ่มทำซ้ำ (เมื่อทำแล้ว) */}
                <div className="flex items-center gap-3 py-5">
                  <button
                    type="button"
                    onClick={() => toggleWeek(row.week)}
                    aria-expanded={open}
                    className="flex flex-1 items-center gap-5 text-left"
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
                      {s ? (
                        <>
                          <p className="text-[15px] font-semibold leading-snug text-ink-900">
                            ทำได้ {s.score}/{s.total} ข้อ ({s.percent}%)
                          </p>
                          <p className="mt-1 max-w-[54ch] text-xs text-ink-400">
                            {s.headline}
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
                  </button>

                  {done && (
                    <Link
                      href={`/student/quiz/${wk}?practice=1`}
                      className="btn-secondary flex-shrink-0 px-3 py-1.5 text-xs"
                    >
                      ทำแบบทดสอบซ้ำ
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleWeek(row.week)}
                    aria-label={open ? "ย่อ" : "กาง"}
                    className="flex-shrink-0"
                  >
                    <ChevronDown
                      className={`h-5 w-5 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {open && (
                  <div className="ml-0 flex flex-col gap-5 pb-6 sm:ml-[76px]">
                    <PracticeHistory
                      studentId={studentId}
                      courseId={courseId}
                      week={row.week}
                      hex={hex}
                    />
                    {s ? (
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
                            {s.topics.map((t) => (
                              <MasteryBar key={t.topic} item={t} />
                            ))}
                          </div>
                          <div className="mt-3">
                            <MasteryLegend />
                          </div>
                        </section>

                        {/* จุดที่เข้าใจคลาดเคลื่อน */}
                        {s.misconceptions.length > 0 && (
                          <section>
                            <h4
                              className="mb-2 text-[11px] font-bold uppercase tracking-wide"
                              style={{ color: hex }}
                            >
                              จุดที่เข้าใจคลาดเคลื่อน
                            </h4>
                            <ul className="flex flex-col gap-3">
                              {s.misconceptions.map((m, i) => (
                                <li
                                  key={i}
                                  className="rounded-lg border border-line bg-paper-50 p-3.5"
                                >
                                  <p className="text-[11px] font-semibold text-tu-gold-700">
                                    {m.topic}
                                  </p>
                                  <p className="mt-1 text-sm font-medium text-ink-800">
                                    {m.question}
                                  </p>
                                  <div className="mt-2.5 space-y-1 text-xs">
                                    <p className="flex gap-2 text-tu-red-700">
                                      <span className="flex-shrink-0 font-bold">
                                        คุณตอบ
                                      </span>
                                      <span>{m.chosenText}</span>
                                    </p>
                                    <p className="flex gap-2 text-[#047857]">
                                      <span className="flex-shrink-0 font-bold">
                                        คำตอบที่ถูก
                                      </span>
                                      <span>{m.correctText}</span>
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}

                        {/* คำแนะนำขั้นถัดไป */}
                        <section>
                          <h4
                            className="mb-2 text-[11px] font-bold uppercase tracking-wide"
                            style={{ color: hex }}
                          >
                            คำแนะนำขั้นถัดไปจาก AI
                          </h4>
                          <ul className="flex flex-col gap-2">
                            {s.nextSteps.map((step, i) => (
                              <li
                                key={i}
                                className="flex gap-3 rounded-md border-l-2 border-tu-gold-500 bg-paper-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-700"
                              >
                                <span className="flex-shrink-0 font-bold text-tu-gold-700">
                                  {i + 1}
                                </span>
                                {step}
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

/** ประวัติการฝึกซ้อม — ปุ่มกะทัดรัด กดแล้วเปิด Modal เลือกดูรายรอบ
 *  (กันไม่ให้หน้าสัปดาห์ยาว/รก จากการโชว์ทุกรอบพร้อมกัน) */
function PracticeHistory({
  studentId,
  courseId,
  week,
  hex,
}: {
  studentId: string | null;
  courseId: string;
  week: string;
  hex: string;
}) {
  const [history, setHistory] = useState<PracticeAttempt[] | null>(null);
  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);

  useEffect(() => {
    const h = getPracticeHistory(studentId, courseId, week);
    setHistory(h);
    if (h.length > 0) setSelId(h[h.length - 1].id); // ค่าเริ่มต้น = รอบล่าสุด
  }, [studentId, courseId, week]);

  if (!history || history.length === 0) return null;

  const selIndex = Math.max(
    0,
    history.findIndex((a) => a.id === selId),
  );
  const sel = history[selIndex] ?? history[history.length - 1];
  const result = gradeQuiz(sel.quiz, sel.answers);
  const d = new Date(sel.at);
  const when = `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  return (
    <section>
      {/* ปุ่มกะทัดรัด — เปิด Modal */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-line bg-paper-50 px-4 py-3 text-left transition hover:border-line-strong hover:bg-paper-100"
      >
        <History className="h-4 w-4 flex-shrink-0" style={{ color: hex }} />
        <span className="text-[13px] font-semibold text-ink-800">
          ประวัติฝึกซ้อม
        </span>
        <span className="text-xs text-ink-400">{history.length} รอบ</span>
        <span className="ml-auto text-xs font-semibold text-tu-red-600">
          ดูประวัติ →
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} maxWidth="max-w-lg">
        <ModalHeader title={`ประวัติฝึกซ้อม · ${week}`} />

        {/* เลือกรอบ */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {history.map((a, i) => {
            const on = a.id === sel.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelId(a.id)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  on
                    ? "border-transparent bg-tu-red-500 text-white"
                    : "border-line bg-white text-ink-600 hover:border-line-strong"
                }`}
              >
                รอบ {i + 1} · {a.percent}%
              </button>
            );
          })}
        </div>

        {/* รายละเอียดรอบที่เลือก */}
        <div className="rounded-xl border border-line bg-paper-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink-800">
              รอบที่ {selIndex + 1}
            </p>
            <p className="text-xs text-ink-400">{when}</p>
            <p className="text-sm font-bold tabular-nums text-ink-900">
              {sel.score}/{sel.total}{" "}
              <span className="font-normal text-ink-400">({sel.percent}%)</span>
            </p>
          </div>

          <hr className="my-3 border-line-soft" />

          {/* รีวิวรายข้อครบทุกข้อ (เหมือนหน้าผลควิซจริง) */}
          <div className="max-h-[55vh] space-y-2.5 overflow-y-auto">
            {result.questions.map((r, i) => (
              <div
                key={r.question.id}
                className={`rounded-lg border bg-white p-3 ${
                  r.isCorrect ? "border-emerald-200" : "border-tu-red-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold leading-snug text-ink-800">
                    <span className="text-ink-400">{i + 1}. </span>
                    {r.question.question}
                  </p>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.isCorrect
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-tu-red-50 text-tu-red-700"
                    }`}
                  >
                    {r.isCorrect ? "ถูก" : "ผิด"}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {r.question.choices.map((c) => {
                    const isCorrect = c.id === r.correctId;
                    const isChosen = c.id === r.chosenId;
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${
                          isCorrect
                            ? "bg-emerald-50 font-semibold text-emerald-800"
                            : isChosen
                              ? "bg-tu-red-50 text-tu-red-700"
                              : "text-ink-600"
                        }`}
                      >
                        <span className="w-3 flex-shrink-0 text-center font-bold">
                          {isCorrect ? "✓" : isChosen ? "✕" : ""}
                        </span>
                        {c.text}
                        {isChosen && !isCorrect && (
                          <span className="ml-auto text-[10px] text-ink-400">
                            คำตอบของคุณ
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
                  <span className="font-bold text-tu-gold-700">AI: </span>
                  {r.feedback}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </section>
  );
}
