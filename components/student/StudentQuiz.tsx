"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCourse } from "@/lib/courseStore";
import type { Quiz } from "@/lib/quiz";
import { gradeQuiz, type QuizResult, type StudentAnswers } from "@/lib/feedback";

type Phase = "loading" | "empty" | "doing" | "result";

/**
 * หน้าทำแบบทดสอบของนักเรียน 1 สัปดาห์
 * ไหลเป็น: ทำข้อสอบ (เลือกตอบ) → ส่งคำตอบ → เห็นคะแนน + feedback จาก AI
 */
export default function StudentQuiz({ week }: { week: string }) {
  const { getQuiz, hydrated } = useCourse();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [answers, setAnswers] = useState<StudentAnswers>({});
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

  function choose(questionId: string, choiceId: string) {
    setAnswers((a) => ({ ...a, [questionId]: choiceId }));
  }

  function submit() {
    if (!quiz) return;
    setResult(gradeQuiz(quiz, answers));
    setPhase("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function retry() {
    setAnswers({});
    setResult(null);
    setPhase("doing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (phase === "loading") {
    return (
      <div className="grid place-items-center py-24 text-sm text-slate-400">
        กำลังโหลด…
      </div>
    );
  }

  if (phase === "empty" || !quiz) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
        <p className="text-sm font-semibold text-slate-600">
          ยังไม่มีแบบทดสอบสำหรับ {week}
        </p>
        <Link
          href="/student"
          className="mt-4 inline-block rounded-xl bg-tu-red-500 px-5 py-2 text-xs font-bold text-white transition hover:bg-tu-red-600"
        >
          กลับไปเลือกสัปดาห์
        </Link>
      </div>
    );
  }

  if (phase === "result" && result) {
    return <ResultView week={week} result={result} onRetry={retry} />;
  }

  // ---------- ทำข้อสอบ ----------
  const answered = quiz.questions.filter((q) => answers[q.id]).length;
  const allAnswered = answered === quiz.questions.length;

  return (
    <div className="space-y-3">
      {/* หัวแบบทดสอบ */}
      <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5">
        <h1 className="text-xl font-bold text-slate-800">{quiz.title}</h1>
        <p className="mt-1 text-xs text-slate-400">
          {week} · {quiz.questions.length} ข้อ · ตอบแล้ว {answered}/
          {quiz.questions.length}
        </p>
      </div>

      {/* คำถาม */}
      {quiz.questions.map((q, i) => (
        <div
          key={q.id}
          className="rounded-2xl border border-slate-100 bg-white px-6 py-5"
        >
          <p className="mb-3 flex gap-2 text-base font-medium text-slate-800">
            <span className="font-bold text-slate-400">{i + 1}.</span>
            {q.question}
          </p>
          <div className="space-y-1">
            {q.choices.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name={q.id}
                  value={c.id}
                  checked={answers[q.id] === c.id}
                  onChange={() => choose(q.id, c.id)}
                  className="h-4 w-4 accent-tu-red-500"
                />
                <span className="text-sm text-slate-700">{c.text}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* ปุ่มส่ง */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href="/student"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white/60"
        >
          ← ออก
        </Link>
        <button
          type="button"
          onClick={submit}
          disabled={!allAnswered}
          className="rounded-lg bg-tu-red-500 px-6 py-2 text-sm font-bold text-white transition hover:bg-tu-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {allAnswered ? "ส่งคำตอบ" : `ตอบให้ครบก่อน (${answered}/${quiz.questions.length})`}
        </button>
      </div>
    </div>
  );
}

/* ---------- หน้าแสดงผล + feedback ---------- */

function ResultView({
  week,
  result,
  onRetry,
}: {
  week: string;
  result: QuizResult;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* สรุปคะแนน */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="h-2.5 bg-tu-gold-500" />
        <div className="px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-tu-gold-600">
            ผลแบบทดสอบ · {week}
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-800">
            {result.score}
            <span className="text-lg font-semibold text-slate-400">
              {" "}
              / {result.total} ข้อ
            </span>
          </p>
          <p className="mt-2 text-sm text-slate-600">{result.overall}</p>
        </div>
      </div>

      {/* รายข้อ + feedback */}
      {result.questions.map((r, i) => (
        <div
          key={r.question.id}
          className="rounded-2xl border border-slate-100 bg-white px-6 py-5"
        >
          <p className="mb-3 flex items-start justify-between gap-3 text-base font-medium text-slate-800">
            <span className="flex gap-2">
              <span className="font-bold text-slate-400">{i + 1}.</span>
              {r.question.question}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                r.isCorrect
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-tu-red-50 text-tu-red-700"
              }`}
            >
              {r.isCorrect ? "ถูก" : "ผิด"}
            </span>
          </p>

          <div className="space-y-1">
            {r.question.choices.map((c) => {
              const isCorrect = c.id === r.correctId;
              const isChosen = c.id === r.chosenId;
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                    isCorrect
                      ? "bg-emerald-50 font-semibold text-emerald-800"
                      : isChosen
                        ? "bg-tu-red-50 text-tu-red-700"
                        : "text-slate-600"
                  }`}
                >
                  <span className="w-4 text-center text-xs">
                    {isCorrect ? "✓" : isChosen ? "✕" : ""}
                  </span>
                  {c.text}
                  {isChosen && !isCorrect && (
                    <span className="text-[10px] text-slate-400">
                      (คำตอบของคุณ)
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">คำแนะนำจาก AI: </span>
            {r.feedback}
          </p>
        </div>
      ))}

      {/* ปุ่ม */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href="/student"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white/60"
        >
          ← เลือกสัปดาห์อื่น
        </Link>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          ทำแบบทดสอบใหม่
        </button>
      </div>
    </div>
  );
}
