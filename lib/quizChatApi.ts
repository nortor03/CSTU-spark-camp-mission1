import type { Quiz, QuizQuestion } from "./quiz";
import type { SyllabusClo } from "./syllabus";
import { weekNumber } from "./weeks";
import { waitForQuizGenerate } from "./aiQuiz";
import { toFrontendQuiz } from "./quizzesApi";

/* ==========================================================================
   จุดเชื่อม AI สำหรับ "แก้ไขควิซที่มีอยู่แล้วต่อยอด" (ผู้ช่วยจัดการรายวิชา ฝั่งอาจารย์)

   POST /api/v1/quiz-generate/revise — ยิงไปยัง AI endpoint เดียวกับตอน generate
   แต่แนบ previousQuiz ไปด้วย เพื่อให้ AI แก้ไขต่อยอด ไม่ใช่เริ่มใหม่ — ใช้ poll
   mechanism เดิมทุกอย่าง (GET /api/v1/quiz-generate/{quiz_run_id}, callback
   ฝั่ง backend จัดการเอง)

   ไม่ auto-save เข้า quizzes table — endpoint นี้แค่คืนควิซที่แก้ไขแล้วกลับมา
   ถ้าจะ persist ต้องเรียก POST /api/v1/quizzes (saveQuizToBackend) เองอีกที
   ========================================================================== */

const QUIZ_API_URL = (
  process.env.NEXT_PUBLIC_QUIZ_API_URL ??
  process.env.NEXT_PUBLIC_COURSES_API_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

interface ReviseQuizStarted {
  quiz_run_id: string;
}

interface ReviseQuizRequest {
  week: number;
  courseCode: string;
  topic: string;
  clos: SyllabusClo[];
  questionCount: number;
  editPrompt: string;
  previousQuiz: ReturnType<typeof toFrontendQuiz>;
  originalPrompt?: string;
}

/**
 * ขอให้ AI แก้ไขควิซที่มีอยู่แล้วต่อยอด (ไม่ใช่ generate ใหม่) — เริ่ม job
 * แล้ว poll ผลด้วย mechanism เดียวกับตอน generate (waitForQuizGenerate)
 */
export async function reviseQuiz(params: {
  week: string;
  courseCode: string;
  topic: string;
  clos: SyllabusClo[];
  questionCount: number;
  editPrompt: string;
  previousQuiz: Quiz;
  originalPrompt?: string;
}): Promise<Quiz> {
  const {
    week,
    courseCode,
    topic,
    clos,
    questionCount,
    editPrompt,
    previousQuiz,
    originalPrompt,
  } = params;

  const res = await fetch(`${QUIZ_API_URL}/api/v1/quiz-generate/revise`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      week: Number(weekNumber(week)),
      courseCode,
      topic,
      clos,
      questionCount,
      editPrompt,
      previousQuiz: toFrontendQuiz(previousQuiz),
      ...(originalPrompt ? { originalPrompt } : {}),
    } satisfies ReviseQuizRequest),
  });
  if (!res.ok) {
    throw new Error(`ส่งคำขอแก้ไขไม่สำเร็จ (${res.status})`);
  }
  const data: ReviseQuizStarted = await res.json();
  return waitForQuizGenerate(data.quiz_run_id, week);
}

/* ---------- สรุปว่าแก้ไขตรงไหนบ้าง (เทียบควิซก่อน/หลัง) ---------- */

function summarizeQuestionChanges(before: QuizQuestion, after: QuizQuestion): string[] {
  const changes: string[] = [];
  if (before.question !== after.question) changes.push("แก้ไขข้อความคำถาม");

  const beforeChoices = before.choices.map((c) => c.text).join("|");
  const afterChoices = after.choices.map((c) => c.text).join("|");
  if (beforeChoices !== afterChoices) {
    const diff = after.choices.length - before.choices.length;
    if (diff > 0) changes.push(`เพิ่มตัวเลือกใหม่ ${diff} ข้อ`);
    else if (diff < 0) changes.push(`ลบตัวเลือกออก ${-diff} ข้อ`);
    else changes.push("แก้ไขข้อความตัวเลือก");
  }

  if (before.answer !== after.answer) changes.push("เปลี่ยนคำตอบที่ถูก");
  if (before.points !== after.points) changes.push(`เปลี่ยนคะแนนเป็น ${after.points}`);
  if ((before.explanation ?? "") !== (after.explanation ?? "")) {
    changes.push("แก้ไขคำอธิบายเฉลย");
  }
  return changes;
}

/** รหัสคำถามที่ AI เพิ่ม/แก้ไข (เทียบก่อน/หลัง) — ใช้ไฮไลต์การ์ดคำถามที่เปลี่ยนใน QuizEditor */
export function getChangedQuestionIds(before: Quiz | null, after: Quiz): string[] {
  if (!before) return after.questions.map((q) => q.id);

  const beforeMap = new Map(before.questions.map((q) => [q.id, q]));
  const changed: string[] = [];

  after.questions.forEach((q) => {
    const prev = beforeMap.get(q.id);
    if (!prev || summarizeQuestionChanges(prev, q).length > 0) {
      changed.push(q.id);
    }
  });

  return changed;
}

/** สรุปเป็นข้อความว่าแก้ไขตรงไหนบ้าง เทียบควิซก่อน/หลังจาก AI แก้ไขมา */
export function summarizeQuizDiff(before: Quiz | null, after: Quiz): string {
  if (!before) return `สร้างคำถามใหม่ ${after.questions.length} ข้อ`;

  const beforeMap = new Map(before.questions.map((q) => [q.id, q]));
  const afterIds = new Set(after.questions.map((q) => q.id));
  const lines: string[] = [];

  after.questions.forEach((q, i) => {
    const prev = beforeMap.get(q.id);
    if (!prev) {
      lines.push(`ข้อ ${i + 1}: เพิ่มคำถามใหม่`);
      return;
    }
    const changes = summarizeQuestionChanges(prev, q);
    if (changes.length > 0) lines.push(`ข้อ ${i + 1}: ${changes.join(", ")}`);
  });

  before.questions.forEach((q) => {
    if (!afterIds.has(q.id)) lines.push(`ลบคำถาม "${q.question}" ออก`);
  });

  return lines.length > 0 ? lines.join("\n") : "ไม่มีการเปลี่ยนแปลง";
}
