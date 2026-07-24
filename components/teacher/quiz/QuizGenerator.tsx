"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import type { Quiz, QuizPrompt } from "@/lib/quiz";
import { emptyPrompt } from "@/lib/quiz";
import { generateQuizJSON } from "@/lib/aiQuiz";
import PageHeader from "@/components/ui/PageHeader";
import QuizPromptForm from "./QuizPromptForm";
import QuizEditor from "./QuizEditor";
import QuizChat from "./QuizChat";

type Phase = "loading" | "prompt" | "generating" | "edit";

/**
 * ตัวควบคุมหลักของหน้าสร้างควิซ 1 สัปดาห์ (state machine 4 เฟส)
 *   loading → prompt → generating → edit
 *
 * ── ท่อข้อมูลฝั่งครู (การ "ส่ง" ระหว่าง component = React props/callback ในหน่วยความจำ
 *    มีแค่ตอนเรียก AI ที่ JSON วิ่งข้าม network) ──
 *
 *   QuizPromptForm  ──onGenerate(prompt)──►  QuizGenerator
 *     prompt: QuizPrompt {clo,topics,files,count,note}   (object ตรง ๆ ไม่ serialize)
 *
 *   QuizGenerator.runGenerate(p):
 *     generateQuizJSON(week, p)   [lib/aiQuiz.ts = "AI seam"]
 *       · ตอนนี้: generateMockQuiz (สร้าง Quiz จำลองในเครื่อง)
 *       · ต่อ AI จริง: fetch("/api/quiz-generate", body: JSON.stringify({week,prompt}))
 *                      → res.json() → aiJsonToQuiz(aiJson)  ← แปลง JSON ดิบ → type Quiz
 *                        (validate + gen id ไม่ซ้ำ + หาเฉลย)
 *     → setQuiz(q) → phase "edit"
 *
 *   <QuizEditor quiz={q}/>   [react-hook-form + useFieldArray]
 *     ครูแก้ title/questions/choices/answer/points → onSave({...quiz, title, questions})
 *     (คง id/revision/week/isActive เดิม เขียนทับแค่ title+questions)
 *
 *   handleSave → saveQuiz(week, quiz)  [courseStore]
 *     → quizzes[week] = [...]  → persist ลง localStorage
 *     → นักเรียนดึงชุด isActive ไป render ต่อ (quizToSurveyJSON → SurveyJS)
 *
 * ── แชทบอท <QuizChat/> ──
 *   เป็น mockup ที่ "แยกตัวสมบูรณ์": คำตอบมาจาก PRESET_ANSWERS + setTimeout
 *   ไม่เรียก AI จริง / ไม่อ่าน-เขียน Quiz หรือ store / ไม่แลก JSON กับใคร
 *   (ครูอ่านไอเดียแล้วพิมพ์เข้า QuizEditor เอง — คนละท่อกับตัวควิซ)
 *
 * แกนกลางของทุกฝั่งคือ type Quiz (lib/quiz.ts) — ครูผลิต, นักเรียนบริโภค
 */
export default function QuizGenerator({ week }: { week: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ?new=1 = สร้างควิซใหม่ (ข้ามควิซที่มีอยู่) / ?quiz=<id> = แก้ควิซชุดนั้นเจาะจง
  const isNew = searchParams.get("new") === "1";
  const editQuizId = searchParams.get("quiz");
  const { topics, clos, quizzes, getQuiz, saveQuiz, hydrated, activeCourseId } =
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

    // สร้างควิซใหม่: ข้ามควิซเดิม เข้าโหมดกรอกโจทย์เลย
    if (isNew) {
      setPhase("prompt");
      return;
    }

    // แก้ควิซเจาะจงตาม id (จากปุ่ม "แก้ไข" ของควิซชุดนั้น) — ถ้าหาไม่เจอ fallback เป็นตัว active
    const list = quizzes[week] ?? [];
    const existing = editQuizId
      ? list.find((q) => q.id === editQuizId) ?? getQuiz(week)
      : getQuiz(week);

    if (existing) {
      setQuiz(existing);
      setPhase("edit");
    } else {
      setPhase("prompt");
    }
  }, [hydrated, week, weekTopics, quizzes, getQuiz, isNew, editQuizId]);

  // ส่งโจทย์ให้ AI (ผ่าน seam) แล้วนำควิซที่ได้ไปเปิดหน้าแก้ไข
  async function runGenerate(p: QuizPrompt) {
    setPrompt(p);
    setPhase("generating");
    const q = await generateQuizJSON(week, p);
    setQuiz(q);
    setPhase("edit");
  }

  async function regenerate() {
    if (!prompt) return;
    setPhase("generating");
    const q = await generateQuizJSON(week, prompt);
    setQuiz(q);
    setPhase("edit");
  }

  function handleSave(saved: Quiz) {
    saveQuiz(week, saved);
    router.push(courseHref);
  }

  // เฟสแก้ไข: ฟอร์มแบบ Google Form เต็มพื้นที่
  if (phase === "edit" && quiz) {
    return (
      <div className="relative min-h-[calc(100vh-80px)]">
        <QuizEditor
          key={quiz.revision}
          quiz={quiz}
          onSave={handleSave}
          onRegenerate={regenerate}
          onEditPrompt={() => setPhase("prompt")}
        />
        <QuizChat />
      </div>
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
      <QuizChat />
    </div>
  );
}
