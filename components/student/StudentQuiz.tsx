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
  const { getQuiz, hydrated, studentId, saveSubmission } = useCourse();

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
    const graded = gradeQuiz(quiz, answers);
    setResult(graded);

    // เก็บผลไว้ให้หน้าสรุปของนักเรียน และรายงานภาพรวมของอาจารย์ใช้ต่อ
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
  }

  function retry() {
    setAnswers({});
    setResult(null);
    setPhase("doing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (phase === "loading") {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  if (phase === "empty" || !quiz) {
    return (
      <div className="card-empty">
        <h2 className="display text-lg">ยังไม่มีแบบทดสอบสำหรับ {week}</h2>
        <p className="mt-2 text-sm text-ink-500">
          อาจารย์ยังไม่ได้สร้างแบบทดสอบของสัปดาห์นี้
        </p>
        <Link href="/student" className="btn-primary mt-5">
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
      {/* หัวแบบทดสอบ + ความคืบหน้า */}
      <div className="card overflow-hidden">
        <div className="h-1.5 bg-tu-red-500" />
        <div className="px-6 py-5">
          <p className="eyebrow">{week}</p>
          <h1 className="display mt-1.5 text-2xl">{quiz.title}</h1>

          <div className="mt-4 flex items-center gap-3">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-200"
              role="progressbar"
              aria-valuenow={answered}
              aria-valuemin={0}
              aria-valuemax={quiz.questions.length}
            >
              <div
                className="h-full rounded-full bg-tu-gold-500 transition-all duration-300"
                style={{
                  width: `${(answered / quiz.questions.length) * 100}%`,
                }}
              />
            </div>
            <span className="flex-shrink-0 text-xs font-semibold text-ink-500">
              {answered}/{quiz.questions.length} ข้อ
            </span>
          </div>
        </div>
      </div>

      {/* คำถาม */}
      {quiz.questions.map((q, i) => (
        <div key={q.id} className="card px-6 py-5">
          <p className="mb-3 flex gap-3 text-base font-medium text-ink-800">
            <span className="display flex-shrink-0 text-lg leading-tight text-ink-300">
              {i + 1}
            </span>
            {q.question}
          </p>
          <div className="space-y-1 pl-8">
            {q.choices.map((c) => {
              const picked = answers[q.id] === c.id;
              return (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition ${
                    picked
                      ? "border-tu-red-300 bg-tu-red-50"
                      : "border-transparent hover:bg-paper-100"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={c.id}
                    checked={picked}
                    onChange={() => choose(q.id, c.id)}
                    className="h-4 w-4 accent-tu-red-500"
                  />
                  <span
                    className={`text-sm ${
                      picked ? "font-semibold text-ink-900" : "text-ink-700"
                    }`}
                  >
                    {c.text}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {/* ปุ่มส่ง */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <Link href="/student" className="btn-ghost">
          ← ออก
        </Link>
        <button
          type="button"
          onClick={submit}
          disabled={!allAnswered}
          className="btn-primary px-6"
        >
          {allAnswered
            ? "ส่งคำตอบ"
            : `ตอบให้ครบก่อน (${answered}/${quiz.questions.length})`}
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
      <div className="card overflow-hidden">
        <div className="h-1.5 bg-tu-gold-500" />
        <div className="px-6 py-6">
          <p className="eyebrow-gold">ผลแบบทดสอบ · {week}</p>
          <p className="mt-2 text-5xl font-bold leading-none text-ink-900">
            {result.score}
            <span className="text-xl font-semibold text-ink-400">
              {" "}
              / {result.total}
            </span>
          </p>
          <hr className="rule-gold my-4" />
          <p className="text-sm leading-relaxed text-ink-600">
            {result.overall}
          </p>

          {/* ทางไปหน้าสรุปจุดแข็ง/จุดอ่อนรายหัวข้อ */}
          <Link
            href={`/student/summary/${week.match(/\d+/)?.[0] ?? ""}`}
            className="btn-primary mt-5"
          >
            ดูสรุปจุดแข็ง / จุดอ่อน →
          </Link>
        </div>
      </div>

      {/* รายข้อ + feedback */}
      {result.questions.map((r, i) => (
        <div key={r.question.id} className="card px-6 py-5">
          <p className="mb-3 flex items-start justify-between gap-3 text-base font-medium text-ink-800">
            <span className="flex gap-3">
              <span className="display flex-shrink-0 text-lg leading-tight text-ink-300">
                {i + 1}
              </span>
              {r.question.question}
            </span>
            <span
              className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
                r.isCorrect
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-tu-red-50 text-tu-red-700 ring-tu-red-200"
              }`}
            >
              {r.isCorrect ? "ถูก" : "ผิด"}
            </span>
          </p>

          <div className="space-y-1 pl-8">
            {r.question.choices.map((c) => {
              const isCorrect = c.id === r.correctId;
              const isChosen = c.id === r.chosenId;
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                    isCorrect
                      ? "bg-emerald-50 font-semibold text-emerald-800"
                      : isChosen
                        ? "bg-tu-red-50 text-tu-red-700"
                        : "text-ink-600"
                  }`}
                >
                  <span className="w-4 flex-shrink-0 text-center text-xs">
                    {isCorrect ? "✓" : isChosen ? "✕" : ""}
                  </span>
                  {c.text}
                  {isChosen && !isCorrect && (
                    <span className="text-[10px] text-ink-400">
                      (คำตอบของคุณ)
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* คำแนะนำจาก AI */}
          <div className="mt-4 ml-8 rounded-md border-l-2 border-tu-gold-500 bg-paper-50 px-3.5 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-tu-gold-700">
              คำแนะนำจาก AI
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-600">
              {r.feedback}
            </p>
          </div>
        </div>
      ))}

      {/* ปุ่ม */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
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
