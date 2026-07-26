"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCourse } from "@/lib/courseStore";
import type { Quiz } from "@/lib/quiz";
import { gradeQuiz, type QuizResult, type StudentAnswers } from "@/lib/feedback";
import SurveyQuizForm from "./SurveyQuizForm";
import { ChevronDown, ChevronLeft } from "lucide-react";

type Phase = "loading" | "empty" | "doing" | "result";

/**
 * หน้าทำแบบทดสอบของนักเรียน 1 สัปดาห์
 * ไหลเป็น: ทำข้อสอบ (เลือกตอบ) → ส่งคำตอบ → เห็นคะแนน + feedback จาก AI
 */
export default function StudentQuiz({ week }: { week: string }) {
  const { getQuiz, hydrated, studentId, saveSubmission } = useCourse();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [result, setResult] = useState<QuizResult | null>(null);
  const inited = useRef(false);

  useEffect(() => {
    if (!hydrated || inited.current) return;
    inited.current = true;
    const q = getQuiz(week);
    if (q) {
      setQuiz(q);
      setPhase("doing");
    } else {
      setPhase("empty");
    }
  }, [hydrated, week, getQuiz]);

  const finish = useCallback(
    (answers: StudentAnswers) => {
      if (!quiz) return;
      const graded = gradeQuiz(quiz, answers);
      setResult(graded);

      const id = studentId ?? "ไม่ระบุรหัส";
      saveSubmission({
        id: `${quiz.revision}-${id}`,
        studentId: id,
        studentName: `นักศึกษา ${id}`,
        week,
        quizRevision: quiz.revision,
        answers,
        score: graded.score,
        total: graded.total,
        percent: graded.percent,
        submittedAt: new Date().toISOString(),
        isCurrentUser: true,
      });

      setPhase("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [quiz, week, studentId, saveSubmission],
  );

  function retry() {
    setResult(null);
    setPhase("doing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-tu-red-500" />
        <p className="text-sm text-ink-400">กำลังโหลด…</p>
      </div>
    );
  }

  if (phase === "empty" || !quiz) {
    return (
      <div className="card-empty">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-paper-200 text-2xl">
          📝
        </div>
        <h2 className="display text-lg">ยังไม่มีแบบทดสอบสำหรับ {week}</h2>
        <p className="mt-2 text-sm text-ink-500">
          อาจารย์ยังไม่ได้สร้างแบบทดสอบของสัปดาห์นี้
        </p>
        <Link href="/student" className="btn-primary mt-6">
          กลับไปเลือกสัปดาห์
        </Link>
      </div>
    );
  }

  if (phase === "result" && result) {
    return <ResultView week={week} result={result} onRetry={retry} />;
  }

  return (
    <div className="animate-fade-in">
      {/* Quiz header — เลื่อนตามเนื้อหา (ไม่ sticky) เพื่อไม่ให้ชื่อควิซค้างเวลาเลื่อนลง */}
      <div className="mb-6 border-b border-line-soft pb-5 pt-1">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/student"
            className="-ml-2.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-500 transition hover:bg-paper-200 hover:text-ink-800"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            ออก
          </Link>
          <span className="rounded-full bg-tu-red-50 px-3 py-1 text-[11px] font-bold text-tu-red-600 ring-1 ring-tu-red-100">
            {week}
          </span>
        </div>

        <h1 className="display text-xl leading-snug sm:text-2xl">{quiz.title}</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {quiz.questions.length} ข้อ · ตอบให้ครบทุกข้อก่อนส่ง
        </p>
      </div>

      <SurveyQuizForm quiz={quiz} onComplete={finish} />
    </div>
  );
}

/* ---------- หน้าแสดงผล + feedback ---------- */

function ScoreRing({ percent }: { percent: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color =
    percent >= 80 ? "#059669" : percent >= 50 ? "#F2A900" : "#C8102E";

  return (
    <div className="relative mx-auto h-36 w-36">
      <svg className="-rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#F5EDE1"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="display text-3xl leading-none text-ink-900">
          {percent}%
        </span>
        <span className="mt-1 text-[11px] font-medium text-ink-400">
          คะแนนรวม
        </span>
      </div>
    </div>
  );
}

function ResultView({
  week,
  result,
  onRetry,
}: {
  week: string;
  result: QuizResult;
  onRetry: () => void;
}) {
  const percent = Math.round((result.score / result.total) * 100);

  // สถานะของ "ทบทวนรายข้อ" — ตัวกรอง + accordion (เปิดข้อที่ตอบผิดไว้ให้ก่อน)
  const wrongIds = result.questions
    .filter((r) => !r.isCorrect)
    .map((r) => r.question.id);
  const [filter, setFilter] = useState<"all" | "wrong">("all");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(wrongIds));
  const toggleOpen = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ระดับผลตามคะแนน — คุมสีของแผงคะแนน + ป้ายระดับ
  const band =
    percent >= 80
      ? {
          label: "เยี่ยมมาก",
          panel: "border-emerald-200 bg-emerald-50",
          pill: "bg-emerald-100 text-emerald-700",
        }
      : percent >= 50
        ? {
            label: "พอใช้",
            panel: "border-tu-gold-200 bg-tu-gold-50",
            pill: "bg-tu-gold-100 text-tu-gold-700",
          }
        : {
            label: "ควรทบทวน",
            panel: "border-tu-red-100 bg-tu-red-50",
            pill: "bg-tu-red-100 text-tu-red-700",
          };

  return (
    <div className="animate-fade-in">
      {/* Score summary — hero: วงคะแนน + ระดับผล + แถบสัดส่วนถูก/ผิด */}
      <div className={`mb-8 rounded-2xl border p-6 sm:p-7 ${band.panel}`}>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <div className="flex-shrink-0">
            <ScoreRing percent={percent} />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="eyebrow-gold">ผลแบบทดสอบ · {week}</p>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${band.pill}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {band.label}
            </span>

            <p className="mt-2 text-2xl font-bold text-ink-900">
              ทำได้ {result.score}{" "}
              <span className="text-lg font-normal text-ink-400">
                / {result.total} ข้อ
              </span>
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-600 sm:mx-0">
              {result.overall}
            </p>

            {/* แถบสัดส่วนถูก/ผิด */}
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-paper-300">
              <div
                className="bg-emerald-500"
                style={{ width: `${percent}%` }}
              />
              <div
                className="bg-tu-red-500"
                style={{ width: `${100 - percent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-ink-500 sm:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                ถูก <b className="font-bold text-ink-800">{result.score}</b>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-tu-red-500" />
                ผิด{" "}
                <b className="font-bold text-ink-800">
                  {result.total - result.score}
                </b>
              </span>
            </div>

            <div className="mt-5 flex justify-center sm:justify-start">
              <Link
                href={`/student/summary/${week.match(/\d+/)?.[0] ?? ""}`}
                className="btn-primary"
              >
                ดูสรุปจุดแข็ง / จุดอ่อน →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Per-question review — accordion + ตัวกรอง (ข้อที่ผิดกางไว้ให้) */}
      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="display text-lg">ทบทวนรายข้อ</h2>
          <div className="inline-flex gap-1 rounded-xl border border-line bg-paper-200 p-1">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filter === "all"
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-700"
              }`}
            >
              ทั้งหมด ({result.questions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("wrong")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filter === "wrong"
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-700"
              }`}
            >
              เฉพาะที่ผิด ({wrongIds.length})
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {result.questions.map((r, i) => {
            if (filter === "wrong" && r.isCorrect) return null;
            const open = openIds.has(r.question.id);
            const ok = r.isCorrect;
            return (
              <div
                key={r.question.id}
                className={`overflow-hidden rounded-2xl border border-l-4 bg-white ${
                  ok
                    ? "border-emerald-100 border-l-emerald-500"
                    : "border-tu-red-100 border-l-tu-red-500"
                }`}
              >
                {/* หัวข้อ — กดกาง/พับ */}
                <button
                  type="button"
                  onClick={() => toggleOpen(r.question.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span
                    className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-lg text-xs font-bold ${
                      ok
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-tu-red-100 text-tu-red-700"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink-800">
                    {r.question.question}
                  </span>
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${
                      ok
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-tu-red-50 text-tu-red-700 ring-tu-red-200"
                    }`}
                  >
                    {ok ? "ถูก" : "ผิด"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-ink-400 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>

                {/* เนื้อหา — ตัวเลือก + คำแนะนำ AI */}
                {open && (
                  <div className="px-4 pb-4">
                    <div className="space-y-1.5">
                      {r.question.choices.map((c) => {
                        const isCorrect = c.id === r.correctId;
                        const isChosen = c.id === r.chosenId;
                        return (
                          <div
                            key={c.id}
                            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm ${
                              isCorrect
                                ? "bg-emerald-50 font-semibold text-emerald-800 ring-1 ring-emerald-200"
                                : isChosen
                                  ? "bg-tu-red-50 text-tu-red-700 ring-1 ring-tu-red-200"
                                  : "text-ink-600"
                            }`}
                          >
                            <span className="w-4 flex-shrink-0 text-center text-xs font-bold">
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

                    <div className="mt-3 rounded-xl border border-tu-gold-200 bg-tu-gold-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-tu-gold-700">
                        ✦ คำแนะนำจาก AI
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
                        {r.feedback}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <Link href="/student" className="btn-ghost">
          ← เลือกสัปดาห์อื่น
        </Link>
        <button type="button" onClick={onRetry} className="btn-secondary">
          ทำแบบทดสอบใหม่
        </button>
      </div>
    </div>
  );
}
