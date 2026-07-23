"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import type { Quiz, QuizPrompt } from "@/lib/quiz";
import { emptyPrompt, generateMockQuiz } from "@/lib/quiz";
import PageHeader from "@/components/ui/PageHeader";
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
  const { topics, clos, getQuiz, saveQuiz, hydrated, activeCourseId } =
    useCourse();

  // กลับไปหน้ารายละเอียดของวิชาที่กำลังทำอยู่
  const courseHref = activeCourseId ? `/course/${activeCourseId}` : "/course";

  const weekTopics = useMemo(
    () =>
      topics
        .filter((t) => t.weekAssigned === week)
        .map((t) => ({ title: t.title, file: t.file })),
    [topics, week],
  );

  // ถ้าวิชานี้มีผลแยก CLO จาก syllabus จริงแล้ว ใช้ชุดนั้นแทน CLO จำลอง
  const cloOptions = useMemo(
    () =>
      clos.length > 0
        ? clos.map((c) => (c.description ? `${c.code}: ${c.description}` : c.code))
        : undefined,
    [clos],
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
    router.push(courseHref);
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
    <div>
      <PageHeader
        eyebrow="การสร้างแบบทดสอบ"
        title={`สร้างแบบทดสอบ · ${week}`}
        action={
          <Link href={courseHref} className="btn-secondary">
            ← กลับไปหน้าวิชา
          </Link>
        }
      />

      <div className="card p-6 sm:p-8">
        {(phase === "loading" || phase === "generating") && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-line-strong border-t-tu-red-500" />
            <p className="display text-base">
              {phase === "generating" ? "กำลังสร้างแบบทดสอบ…" : "กำลังโหลด…"}
            </p>
            {phase === "generating" && (
              <p className="text-xs text-ink-500">
                ระบบกำลังออกข้อสอบจากหัวข้อและไฟล์ที่เลือก
              </p>
            )}
          </div>
        )}

        {phase === "prompt" &&
          (weekTopics.length === 0 ? (
            <div className="py-12 text-center">
              <h2 className="display text-lg">สัปดาห์นี้ยังไม่มีหัวข้อ</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
                กลับไปจัดหัวข้อเข้า “{week}” ก่อน แล้วค่อยกลับมาสร้างแบบทดสอบ
              </p>
              <Link href="/topics" className="btn-primary mt-5">
                ไปจัดหัวข้อ
              </Link>
            </div>
          ) : (
            <QuizPromptForm
              initial={prompt}
              sourceTopics={weekTopics}
              cloOptions={cloOptions}
              onGenerate={runGenerate}
            />
          ))}
      </div>
    </div>
  );
}
