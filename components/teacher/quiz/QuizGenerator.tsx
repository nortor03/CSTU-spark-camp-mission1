"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import type { Quiz, QuizPrompt } from "@/lib/quiz";
import { emptyPrompt, MOCK_CLOS } from "@/lib/quiz";
import { generateQuizJSON } from "@/lib/aiQuiz";
import { saveQuizToBackend } from "@/lib/quizzesApi";
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
  const searchParams = useSearchParams();
  // ?new=1 = สร้างควิซใหม่ (ข้ามควิซที่มีอยู่) / ?quiz=<id> = แก้ควิซชุดนั้นเจาะจง
  const isNew = searchParams.get("new") === "1";
  const editQuizId = searchParams.get("quiz");
  const {
    subject,
    courseCode,
    topics,
    clos,
    quizzes,
    getQuiz,
    saveQuiz,
    pendingQuizRevisions,
    pendingQuizChangedIds,
    setPendingQuizRevision,
    hydrated,
    activeCourseId,
  } = useCourse();

  // กลับไปหน้ารายละเอียดของวิชาที่กำลังทำอยู่
  const courseHref = activeCourseId ? `/course/${activeCourseId}` : "/course";

  const weekTopics = useMemo(
    () =>
      topics
        .filter((t) => t.weekAssigned === week)
        .map((t) => ({ title: t.title, file: t.file, relatedClos: t.relatedClos })),
    [topics, week],
  );

  // CLO ที่เกี่ยวข้องกับหัวข้อของสัปดาห์นี้ (จาก syllabus จริง) — ใช้โชว์แบบล็อกในฟอร์ม
  // วิชาที่ยังไม่มีผลแยก CLO จริง (clos ว่าง) ใช้ CLO จำลองแทน
  // backend บังคับว่า clo ห้ามส่ง array ว่าง — ถ้าไม่มีหัวข้อไหนแม็ตช์ CLO เลย fallback ไปทั้งชุดของวิชา
  const suggestedClos = useMemo(() => {
    if (clos.length === 0) return MOCK_CLOS;
    const codes = new Set(weekTopics.flatMap((t) => t.relatedClos ?? []));
    const matched = clos.filter((c) => codes.has(c.code));
    const result = matched.length > 0 ? matched : clos;
    return result.map((c) => (c.description ? `${c.code}: ${c.description}` : c.code));
  }, [clos, weekTopics]);

  const [phase, setPhase] = useState<Phase>("loading");
  const [prompt, setPrompt] = useState<QuizPrompt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [genError, setGenError] = useState("");
  const inited = useRef(false);

  // ตั้งค่าเริ่มต้นครั้งเดียวหลังโหลด store เสร็จ
  useEffect(() => {
    if (!hydrated || inited.current) return;
    inited.current = true;

    const basePrompt: QuizPrompt = {
      ...emptyPrompt(),
      clo: suggestedClos,
      topics: weekTopics.map((t) => t.title),
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
  }, [hydrated, week, weekTopics, suggestedClos, quizzes, getQuiz, isNew, editQuizId]);

  // sync ควิซที่โชว์อยู่ให้ตรงกับ store เสมอ — เผื่อผู้ช่วย AI (side panel) แก้ไข/บันทึก
  // ควิซของสัปดาห์นี้อยู่เบื้องหลังระหว่างที่หน้านี้เปิดค้างอยู่ (quiz state ในนี้ไม่ได้
  // subscribe การเปลี่ยนแปลงของ store อัตโนมัติ ถ้าไม่เช็คเทียบ revision จะค้างข้อมูลเก่า)
  // เทียบด้วย id ตรง ๆ (ไม่ใช้ getQuiz ที่คืนตัว active) เผื่อกำลังแก้ควิซที่ไม่ใช่ตัว active
  // อยู่ (มาจาก ?quiz=<id>) จะได้ไม่โดนสลับเป็นตัว active ไปโดยไม่ได้ตั้งใจ
  useEffect(() => {
    if (phase !== "edit" || !quiz) return;
    const latest = (quizzes[week] ?? []).find((q) => q.id === quiz.id);
    if (latest && latest.revision !== quiz.revision) {
      setQuiz(latest);
    }
  }, [phase, week, quiz, quizzes]);

  // ส่งโจทย์ให้ AI (ผ่าน seam) แล้วนำควิซที่ได้ไปเปิดหน้าแก้ไข
  async function runGenerate(p: QuizPrompt) {
    setPrompt(p);
    setPhase("generating");
    setGenError("");
    try {
      const q = await generateQuizJSON(week, subject, courseCode, p);
      setQuiz(q);
      setPhase("edit");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "สร้างแบบทดสอบไม่สำเร็จ");
      setPhase("prompt");
    }
  }

  async function regenerate() {
    if (!prompt) return;
    setPhase("generating");
    setGenError("");
    try {
      const q = await generateQuizJSON(week, subject, courseCode, prompt);
      setQuiz(q);
      setPhase("edit");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "สร้างแบบทดสอบไม่สำเร็จ");
      setPhase("prompt");
    }
  }

  function handleSave(saved: Quiz) {
    saveQuiz(week, saved);
    // เคลียร์ preview ที่ค้างไว้ (ถ้ามี) — บันทึกจริงแล้วไม่ใช่แค่ preview อีกต่อไป
    setPendingQuizRevision(week, null);
    // sync ไป backend แบบ best-effort — ไม่บล็อกการบันทึกในเครื่อง ถ้า backend ล่ม/เข้าไม่ถึง
    if (activeCourseId) {
      saveQuizToBackend(activeCourseId, week, saved).catch((err) => {
        console.error("บันทึกแบบทดสอบที่ backend ไม่สำเร็จ (ยังบันทึกในเครื่องได้ปกติ)", err);
      });
    }
    router.push(courseHref);
  }

  // ผู้ช่วย AI (side panel) อาจแก้ไขควิซของสัปดาห์นี้มาให้ดูก่อนโดยยังไม่ได้บันทึก —
  // ถ้ามี preview ค้างอยู่ ให้โชว์ตัวนั้นแทนตัวที่บันทึกไว้จริง พร้อมแถบเตือนให้รู้ว่ายังไม่ได้บันทึก
  const pendingPreview = pendingQuizRevisions[week] ?? null;
  const displayQuiz = pendingPreview ?? quiz;
  const changedQuestionIds = pendingPreview ? (pendingQuizChangedIds[week] ?? []) : [];

  // เฟสแก้ไข: ฟอร์มแบบ Google Form เต็มพื้นที่
  if (phase === "edit" && displayQuiz) {
    return (
      <div className="relative min-h-[calc(100vh-80px)]">
        {pendingPreview && (
          <div className="mx-auto mb-3 flex max-w-2xl items-start gap-2 rounded-xl border border-tu-gold-200 bg-tu-gold-50 px-4 py-2.5 text-xs font-semibold text-tu-gold-700">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              นี่คือตัวอย่างที่ผู้ช่วย AI แก้ไขมาให้ — ยังไม่ได้บันทึก ยืนยันจากแชทผู้ช่วย หรือกด
              "บันทึกแบบทดสอบ" ด้านล่างเพื่อบันทึกจริง
            </span>
          </div>
        )}
        <QuizEditor
          key={displayQuiz.revision}
          quiz={displayQuiz}
          highlightQuestionIds={changedQuestionIds}
          onSave={handleSave}
          onRegenerate={regenerate}
          onEditPrompt={() => setPhase("prompt")}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="การสร้างแบบทดสอบ"
        title={`สร้างแบบทดสอบ · ${week}`}
        subtitle={courseCode ? `${subject} · ${courseCode}` : subject}
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
            <>
              {genError && <p className="alert-error mb-4">{genError}</p>}
              <QuizPromptForm
                initial={prompt}
                sourceTopics={weekTopics}
                onGenerate={runGenerate}
              />
            </>
          ))}
      </div>
    </div>
  );
}
