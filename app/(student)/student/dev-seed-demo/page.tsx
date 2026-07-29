"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import { buildMockCourseSeed } from "@/lib/mockCourseSeed";
import { generateMockQuiz, emptyPrompt, type Quiz } from "@/lib/quiz";
import type { StudentAnswers } from "@/lib/feedback";
import type { Submission } from "@/lib/analytics";
import { savePracticeAttempt } from "@/lib/practiceHistory";

/**
 * หน้าชั่วคราวสำหรับ demo เท่านั้น (ไม่ใช่ฟีเจอร์ถาวร ลบทิ้งได้ทุกเมื่อ)
 * สร้างวิชา + ผลสอบตัวอย่างหลายสัปดาห์ (คะแนนไม่เท่ากัน) + ประวัติฝึกซ้อม
 * แล้วพาไปหน้าสรุปภาพรวมวิชา (/student/summary/course/[id]) ให้ดูของจริง
 *
 * ปรับจำนวนสัปดาห์ผ่าน query param: /student/dev-seed-demo?weeks=15
 * (ค่าเริ่มต้น 4 สัปดาห์ — ใช้ course id เดิม ไม่ชนกับของเดิม)
 */

const DEMO_STUDENT_ID = "demo-6800123";
const DEMO_STUDENT_NAME = "นักศึกษาตัวอย่าง";

// เปอร์เซ็นต์ตัวอย่างไล่ผสมทั้ง เข้าใจดี/พอใช้/ควรทบทวน — ใช้วนซ้ำถ้าสัปดาห์เยอะกว่านี้
const PERCENT_PATTERN = [
  92, 74, 42, 63, 85, 38, 67, 91, 55, 73, 48, 88, 62, 79, 50, 95, 44, 70, 83, 58,
];

/** เลือกคำตอบให้ได้เปอร์เซ็นต์ใกล้เคียงเป้าหมาย (ข้อแรก ๆ ตอบถูก ที่เหลือตอบผิด) */
function answersForTarget(quiz: Quiz, targetPercent: number): StudentAnswers {
  const correctCount = Math.round((targetPercent / 100) * quiz.questions.length);
  const answers: StudentAnswers = {};
  quiz.questions.forEach((q, i) => {
    if (i < correctCount) {
      answers[q.id] = q.answer;
    } else {
      const wrong = q.choices.find((c) => c.id !== q.answer);
      answers[q.id] = wrong ? wrong.id : q.answer;
    }
  });
  return answers;
}

function scoreOf(quiz: Quiz, answers: StudentAnswers) {
  let correct = 0;
  quiz.questions.forEach((q) => {
    if (answers[q.id] === q.answer) correct += 1;
  });
  return { correct, total: quiz.questions.length };
}

/** ผูกแต่ละคำถามเข้ากับ CLO วนไปเรื่อย ๆ — generateMockQuiz ปกติไม่ใส่ relatedClos ให้
 *  (ทำเฉพาะใน demo นี้ เพื่อให้ CLO radar มีข้อมูลให้ดู ไม่กระทบตัว generator จริง) */
function tagWithClos(quiz: Quiz, cloCodes: string[]): Quiz {
  if (cloCodes.length === 0) return quiz;
  return {
    ...quiz,
    questions: quiz.questions.map((q, i) => ({
      ...q,
      relatedClos: [cloCodes[i % cloCodes.length]],
    })),
  };
}

export default function DevSeedDemoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    hydrated,
    activeCourseId,
    getCourse,
    addCourse,
    setStudentId,
    saveSubmission,
  } = useCourse();

  // จำนวนสัปดาห์ปรับได้ผ่าน ?weeks=15 — ดีฟอลต์ 4 สัปดาห์
  // หมายเหตุ: มี "-v3" ต่อท้ายเพื่อกันชนกับข้อมูล demo รุ่นเก่าที่ค้างใน localStorage
  // (v3 = ทุกคำถามผูก CLO ไว้ด้วย ให้ CLO radar มีข้อมูลให้ดู)
  const weekCount = Math.min(
    Math.max(Number(searchParams.get("weeks")) || 4, 1),
    26,
  );
  const courseId = `course-demo-cn101-v3-${weekCount}wk`;

  const startedRef = useRef(false);
  const savedRef = useRef(false);
  const [status, setStatus] = useState("กำลังเตรียมข้อมูลตัวอย่าง…");

  // Step 1: สร้างวิชา + ควิซตัวอย่างตามจำนวนสัปดาห์ (ครั้งเดียว หลัง store โหลดเสร็จ)
  useEffect(() => {
    if (!hydrated || startedRef.current) return;
    startedRef.current = true;

    setStudentId(DEMO_STUDENT_ID);

    const seed = buildMockCourseSeed(
      "course-syllabus-demo.pdf",
      "CN101",
      "การเขียนโปรแกรมเบื้องต้น (ตัวอย่าง)",
      Math.max(6, weekCount),
      weekCount,
    );

    // ผูกคำถามของทุกควิซทางการเข้ากับ CLO ให้ CLO radar มีข้อมูลให้ดูใน demo
    const cloCodes = seed.extraction.clos.map((c) => c.code);
    for (const week of Object.keys(seed.quizzes)) {
      seed.quizzes[week] = seed.quizzes[week].map((q) => tagWithClos(q, cloCodes));
    }

    addCourse(
      "การเขียนโปรแกรมเบื้องต้น (ตัวอย่าง)",
      "course-syllabus-demo.pdf",
      null,
      seed.topics,
      seed.extraction,
      courseId,
      "CN101",
      seed.quizzes,
    );

    setStatus("กำลังสร้างผลสอบตัวอย่าง…");
  }, [hydrated, addCourse, setStudentId, courseId, weekCount]);

  // Step 2: รอให้วิชานี้กลายเป็น active ก่อน (saveSubmission ทำงานกับวิชา active เท่านั้น)
  // แล้วค่อยบันทึกผลสอบทุกสัปดาห์ + ประวัติฝึกซ้อมของ 2 สัปดาห์ที่อ่อนที่สุด
  useEffect(() => {
    if (activeCourseId !== courseId || savedRef.current) return;
    const course = getCourse(courseId);
    if (!course) return;
    savedRef.current = true;

    const targets: [string, number][] = Array.from({ length: weekCount }, (_, i) => [
      `สัปดาห์ที่ ${i + 1}`,
      PERCENT_PATTERN[i % PERCENT_PATTERN.length],
    ]);

    let dayOffset = 7 * weekCount;
    for (const [week, pct] of targets) {
      const quiz = course.quizzes[week]?.[0];
      if (!quiz) continue;
      const answers = answersForTarget(quiz, pct);
      const { correct, total } = scoreOf(quiz, answers);

      const submission: Submission = {
        id: `demo-sub-${week}`,
        studentId: DEMO_STUDENT_ID,
        studentName: DEMO_STUDENT_NAME,
        week,
        quizRevision: quiz.revision,
        answers,
        score: correct,
        total,
        percent: total > 0 ? Math.round((correct / total) * 100) : 0,
        submittedAt: new Date(
          Date.now() - dayOffset * 24 * 60 * 60 * 1000,
        ).toISOString(),
        isCurrentUser: true,
      };
      saveSubmission(submission);
      dayOffset -= 7;
    }

    // ประวัติฝึกซ้อม — สร้างให้ "ทุกสัปดาห์" (ไม่ใช่แค่สัปดาห์ที่อ่อนสุด) เพื่อให้ทุกหน้ามีข้อมูล
    // จำนวนรอบวนที่ 1/2/3 สลับกันไป ให้เห็นทั้งเคสไม่มี round-picker (1 รอบ) และมี (2-3 รอบ)
    // คะแนนเริ่มต่ำกว่าผลจริงเล็กน้อยแล้วค่อย ๆ ดีขึ้นทีละรอบ (โชว์พัฒนาการ)
    targets.forEach(([week, officialPct], i) => {
      const quiz = course.quizzes[week]?.[0];
      if (!quiz) return;
      const topic = quiz.title.replace("แบบทดสอบ ", "");
      const roundCount = (i % 3) + 1;
      const basePct = Math.max(30, officialPct - 25);

      for (let r = 0; r < roundCount; r++) {
        const pct = Math.min(98, basePct + r * 15);
        const practiceQuiz = tagWithClos(
          generateMockQuiz(week, {
            ...emptyPrompt(),
            topics: [topic],
            count: quiz.questions.length,
          }),
          course.clos.map((c) => c.code),
        );
        const answers = answersForTarget(practiceQuiz, pct);
        const { correct, total } = scoreOf(practiceQuiz, answers);
        savePracticeAttempt(DEMO_STUDENT_ID, courseId, week, {
          id: `demo-practice-${week}-${r}`,
          at: new Date(
            Date.now() - (roundCount - r) * 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          score: correct,
          total,
          percent: total > 0 ? Math.round((correct / total) * 100) : 0,
          quiz: practiceQuiz,
          answers,
        });
      }
    });

    setStatus("เสร็จแล้ว กำลังพาไปหน้าสรุปภาพรวม…");
    setTimeout(() => {
      router.replace(`/student/summary/course/${courseId}`);
    }, 400);
  }, [activeCourseId, getCourse, saveSubmission, router, courseId, weekCount]);

  return (
    <div className="grid min-h-screen place-items-center bg-paper-50 px-6 text-center">
      <div>
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-[3px] border-line-strong border-t-tu-red-500" />
        <p className="text-sm text-ink-600">{status}</p>
      </div>
    </div>
  );
}
