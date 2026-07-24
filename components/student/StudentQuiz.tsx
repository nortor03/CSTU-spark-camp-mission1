"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCourse } from "@/lib/courseStore";
import type { Quiz } from "@/lib/quiz";
import { gradeQuiz, type QuizResult, type StudentAnswers } from "@/lib/feedback";
import SurveyQuizForm from "./SurveyQuizForm";

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
      {/* Sticky quiz header */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-line-soft bg-paper-50/90 px-4 pb-5 pt-1 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/student"
            className="-ml-2.5 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-500 transition hover:bg-paper-200 hover:text-ink-800"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path
                d="M10 12L6 8l4-4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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

  return (
    <div className="animate-fade-in">
      {/* Score summary card */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="border-b border-line-soft bg-paper-100/60 px-6 py-4">
          <p className="eyebrow-gold">ผลแบบทดสอบ</p>
          <p className="mt-0.5 text-sm font-medium text-ink-600">{week}</p>
        </div>

        <div className="px-6 py-8 text-center">
          <ScoreRing percent={percent} />
          <p className="mt-4 text-lg font-semibold text-ink-800">
            {result.score}{" "}
            <span className="font-normal text-ink-400">/ {result.total} ข้อ</span>
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-600">
            {result.overall}
          </p>
          <Link
            href={`/student/summary/${week.match(/\d+/)?.[0] ?? ""}`}
            className="btn-primary mt-6"
          >
            ดูสรุปจุดแข็ง / จุดอ่อน →
          </Link>
        </div>
      </div>

      {/* Per-question review */}
      <div className="space-y-4">
        {result.questions.map((r, i) => (
          <div
            key={r.question.id}
            className={`overflow-hidden rounded-2xl border bg-white shadow-card ${
              r.isCorrect ? "border-emerald-200" : "border-tu-red-100"
            }`}
          >
            <div
              className={`flex items-start justify-between gap-3 px-5 py-4 ${
                r.isCorrect ? "bg-emerald-50/60" : "bg-tu-red-50/40"
              }`}
            >
              <div className="flex gap-3">
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    r.isCorrect
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-tu-red-100 text-tu-red-700"
                  }`}
                >
                  {i + 1}
                </span>
                <p className="text-sm font-semibold leading-snug text-ink-800">
                  {r.question.question}
                </p>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
                  r.isCorrect
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-tu-red-50 text-tu-red-700 ring-tu-red-200"
                }`}
              >
                {r.isCorrect ? "ถูก" : "ผิด"}
              </span>
            </div>

            <div className="space-y-1.5 px-5 py-4">
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

            <div className="border-t border-line-soft bg-paper-50 px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-tu-gold-700">
                คำแนะนำจาก AI
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-600">
                {r.feedback}
              </p>
            </div>
          </div>
        ))}
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
