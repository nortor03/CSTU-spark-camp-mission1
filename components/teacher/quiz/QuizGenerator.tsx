"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import type { Quiz, QuizPrompt } from "@/lib/quiz";
import { emptyPrompt, generateMockQuiz } from "@/lib/quiz";
import QuizPromptForm from "./QuizPromptForm";
import QuizEditor from "./QuizEditor";

type Phase = "loading" | "prompt" | "generating" | "edit";

/**
 * ตัวควบคุมหลักของหน้าสร้างควิซ 1 สัปดาห์
 * - ดึงหัวข้อของสัปดาห์นั้นจาก store มาเติมในโจทย์ให้อัตโนมัติ
 * - ถ้าเคยบันทึกควิซไว้แล้ว จะเปิดเข้าโหมดแก้ไขทันที
 * - บันทึกแล้วเก็บลง store แล้วกลับหน้าภาพรวม
 */
export default function QuizGenerator({ week }: { week: string }) {
  const router = useRouter();
  const { topics, getQuiz, saveQuiz, hydrated } = useCourse();

  const weekTopics = useMemo(
    () =>
      topics
        .filter((t) => t.weekAssigned === week)
        .map((t) => ({ title: t.title, file: t.file })),
    [topics, week],
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [prompt, setPrompt] = useState<QuizPrompt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const inited = useRef(false);

  // ตั้งค่าเริ่มต้นครั้งเดียวหลังโหลด store เสร็จ
  useEffect(() => {
    if (!hydrated || inited.current) return;
    inited.current = true;

    const basePrompt: QuizPrompt = {
      ...emptyPrompt(),
      topics: weekTopics.map((t) => t.title),
      files: weekTopics.map((t) => t.file),
    };
    setPrompt(basePrompt);

    const existing = getQuiz(week);
    if (existing) {
      setQuiz(existing);
      setPhase("edit");
    } else {
      setPhase("prompt");
    }
  }, [hydrated, week, weekTopics, getQuiz]);

  function runGenerate(p: QuizPrompt) {
    setPrompt(p);
    setPhase("generating");
    setTimeout(() => {
      setQuiz(generateMockQuiz(week, p));
      setPhase("edit");
    }, 900);
  }

  function regenerate() {
    if (!prompt) return;
    setPhase("generating");
    setTimeout(() => {
      setQuiz(generateMockQuiz(week, prompt));
      setPhase("edit");
    }, 900);
  }

  function handleSave(saved: Quiz) {
    saveQuiz(week, saved);
    router.push("/course");
  }

  // เฟสแก้ไข: ฟอร์มแบบ Google Form เต็มพื้นที่
  if (phase === "edit" && quiz) {
    return (
      <QuizEditor
        key={quiz.revision}
        quiz={quiz}
        onSave={handleSave}
        onRegenerate={regenerate}
        onEditPrompt={() => setPhase("prompt")}
      />
    );
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-tu-red-500">
          สร้างควิซ
        </p>
        <h1 className="mt-0.5 text-2xl font-bold text-slate-800">{week}</h1>
        <p className="mt-1 text-xs text-slate-400">
          กรอกโจทย์ให้ระบบช่วยออกข้อสอบ (CLO, หัวข้อ, ไฟล์อ้างอิง)
        </p>
      </div>

      {(phase === "loading" || phase === "generating") && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-tu-red-500" />
          <p className="text-sm font-semibold text-slate-600">
            {phase === "generating" ? "กำลังสร้างควิซ…" : "กำลังโหลด…"}
          </p>
          {phase === "generating" && (
            <p className="text-xs text-slate-400">
              ระบบกำลังออกข้อสอบจากหัวข้อและไฟล์ที่เลือก
            </p>
          )}
        </div>
      )}

      {phase === "prompt" &&
        (weekTopics.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-slate-600">
              สัปดาห์นี้ยังไม่มีหัวข้อ
            </p>
            <p className="mt-1 text-xs text-slate-400">
              กลับไปจัดหัวข้อเข้า “{week}” ก่อน แล้วค่อยกลับมาสร้างควิซ
            </p>
            <Link
              href="/topics"
              className="mt-4 inline-block rounded-xl bg-tu-red-500 px-5 py-2 text-xs font-bold text-white transition hover:bg-tu-red-600"
            >
              ไปจัดหัวข้อ
            </Link>
          </div>
        ) : (
          <QuizPromptForm
            initial={prompt}
            sourceTopics={weekTopics}
            onGenerate={runGenerate}
          />
        ))}
    </div>
  );
}
