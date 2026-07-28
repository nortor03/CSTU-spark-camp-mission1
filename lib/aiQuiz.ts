import type { Quiz, QuizChoice, QuizPrompt, QuizQuestion, QuizSource } from "./quiz";
import { weekNumber } from "./weeks";

/* ==========================================================================
   จุดเชื่อม AI สำหรับ "สร้างควิซจากโจทย์" (AI seam) — ต่อ backend จริงแล้ว
   (schema ยืนยันจาก /openapi.json ของ backend เอง — QuizGenerateRequest/
   QuizPromptIn/QuizRunStatus/FrontendQuiz)

   Flow: POST /api/v1/quiz-generate → ได้ { quiz_run_id } กลับมา (202) →
   poll GET /api/v1/quiz-generate/{quiz_run_id} ทุก ๆ 2-3 วิ จนกว่า status
   จะเป็น "completed" แล้วอ่าน quiz field ออกมาใช้

   Payload ของ POST (ตาม QuizGenerateRequest):
     {
       week: number,           // integer >= 1
       courseName: string,     // required, ห้ามว่าง
       courseCode: string,     // required, ห้ามว่าง/null (ต่างจากที่เคยคิดไว้)
       prompt: {
         clo: string[],        // required, อย่างน้อย 1 รายการ
         topics: string[],     // required, อย่างน้อย 1 รายการ
         count: number,        // 1-20
         note: string,         // default ""
       },
     }

   Callback (POST /api/v1/quiz-generate/callback) เป็นจุดที่ AI service ยิงกลับมา
   เอง ฝั่ง frontend ไม่เกี่ยวข้อง — backend เป็นคนอัปเดตสถานะ run ให้ตอน poll เจอ

   ส่วน UI ทั้งหมด (หน้ากรอกโจทย์ / หน้าแก้ไข / แชทบอท) เรียกผ่าน generateQuizJSON
   นี้เท่านั้น
   ========================================================================== */

const QUIZ_API_URL = (
  process.env.NEXT_PUBLIC_QUIZ_API_URL ??
  process.env.NEXT_PUBLIC_COURSES_API_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

const POLL_INTERVAL_MS = 2500;

interface QuizGenerateStarted {
  quiz_run_id: string;
}

/**
 * รูปที่ backend ส่งกลับมาจริง ๆ ตอนนี้ยังไม่ตรงกับ FrontendQuiz ที่ประกาศไว้ใน
 * openapi.json — เป็น shape ดิบของ AI service เอง (snake_case, question_id,
 * correct_choice_id, course_code, week_number, ...) เลยรับแบบหลวม ๆ ไว้ก่อน
 * แล้วค่อย normalize เป็น Quiz ของเราใน normalizeQuiz()
 */
interface RawQuizSource {
  document_id?: string;
  documentId?: string;
  filename: string;
  source_location?: string;
  sourceLocation?: string;
}

interface RawQuizQuestion {
  id?: string;
  question_id?: string;
  type?: string;
  question_type?: string;
  question: string;
  choices: QuizChoice[];
  answer?: string;
  correct_choice_id?: string;
  points?: number;
  topic?: string;
  explanation?: string;
  related_clos?: string[];
  relatedClos?: string[];
  topic_tags?: string[];
  topicTags?: string[];
  grounding?: string;
  sources?: RawQuizSource[];
}

interface RawQuiz {
  id?: string;
  isActive?: boolean;
  revision?: string;
  title?: string;
  /** shape ดิบใช้ "topic" เดี่ยว ๆ เป็นหัวข้อรวมของทั้งชุด แทนที่จะมี title */
  topic?: string;
  course_code?: string;
  week_number?: number;
  questions: RawQuizQuestion[];
}

/** ตรงกับ QuizRunStatus ใน openapi.json — ตอนนี้มี error field แล้ว (surface เหตุผลจริงถ้า AI ส่งมา) */
interface QuizRunStatus {
  status: string;
  quiz?: RawQuiz | null;
  error?: string | null;
}

function fallbackId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSource(s: RawQuizSource): QuizSource {
  return {
    documentId: s.document_id ?? s.documentId ?? "",
    filename: s.filename,
    sourceLocation: s.source_location ?? s.sourceLocation ?? "",
  };
}

function normalizeQuestion(
  q: RawQuizQuestion,
  fallbackTopic?: string,
): QuizQuestion {
  return {
    id: q.id ?? q.question_id ?? fallbackId("q"),
    type: "mcq",
    question: q.question,
    choices: q.choices,
    answer: q.answer ?? q.correct_choice_id ?? "",
    points: q.points ?? 1,
    topic: q.topic ?? fallbackTopic,
    explanation: q.explanation,
    relatedClos: q.related_clos ?? q.relatedClos,
    topicTags: q.topic_tags ?? q.topicTags,
    grounding: q.grounding,
    sources: q.sources?.map(normalizeSource),
  };
}

/** แปลง quiz ที่ backend คืนมา (ไม่ว่าจะเป็น shape ดิบหรือ FrontendQuiz) ให้เป็น Quiz ของเรา */
function normalizeQuiz(raw: RawQuiz, week: string): Quiz {
  return {
    id: raw.id ?? fallbackId("quiz"),
    isActive: false,
    revision: raw.revision ?? fallbackId("rev"),
    week,
    title: raw.title ?? (raw.topic ? `แบบทดสอบ ${raw.topic}` : `แบบทดสอบ ${week}`),
    questions: raw.questions.map((q) => normalizeQuestion(q, raw.topic)),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * บาง error ที่ backend ส่งมาเป็น str(dict) ของ Python (เช่น
 * "{'code': 'quiz_generation_failed', 'message': '...'}") ไม่ใช่ JSON จริง —
 * ดึงเอาแค่ field message ออกมาโชว์ให้อ่านง่าย ถ้า parse ไม่ได้ก็ใช้ข้อความดิบแทน
 */
function friendlyRunError(raw: string): string {
  const match = raw.match(/['"]message['"]\s*:\s*['"]([^'"]*)['"]/);
  return match ? match[1] : raw;
}

/** เริ่ม generate ควิซ (async job ฝั่ง backend) — คืน quiz_run_id ให้ไป poll ต่อ */
async function startQuizGenerate(
  week: string,
  courseName: string,
  courseCode: string,
  prompt: QuizPrompt,
): Promise<string> {
  const res = await fetch(`${QUIZ_API_URL}/api/v1/quiz-generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      week: Number(weekNumber(week)),
      courseName,
      courseCode,
      prompt, // { clo, topics, count, note } — ต้องส่งซ้อนใน key "prompt" ตามที่ backend กำหนด
    }),
  });
  if (!res.ok) {
    throw new Error(`เริ่มสร้างแบบทดสอบไม่สำเร็จ (${res.status})`);
  }
  const data: QuizGenerateStarted = await res.json();
  return data.quiz_run_id;
}

/**
 * poll สถานะ job ไปเรื่อย ๆ ไม่มี timeout จนกว่าจะ "completed" (คืน quiz) หรือ "failed" (throw)
 * exported ไว้ให้ lib/quizChatApi.ts (โหมดแชทแก้ควิซ) เรียกใช้ซ้ำได้ — poll/normalize
 * เป็น mechanism เดียวกันไม่ว่าจะ start job มาจาก generate-from-scratch หรือ chat-edit
 */
export async function waitForQuizGenerate(
  quizRunId: string,
  week: string,
): Promise<Quiz> {
  while (true) {
    const res = await fetch(
      `${QUIZ_API_URL}/api/v1/quiz-generate/${encodeURIComponent(quizRunId)}`,
    );
    if (!res.ok) {
      throw new Error(`ตรวจสอบสถานะแบบทดสอบไม่สำเร็จ (${res.status})`);
    }
    const run: QuizRunStatus = await res.json();

    if (run.status === "completed" && run.quiz) {
      // week/isActive ยึดตามฝั่งเราเสมอ ไม่เชื่อค่าที่ backend คืนมา
      // (backend ไม่รู้จักรูปแบบ "สัปดาห์ที่ N" ที่ใช้เป็น key ในเครื่อง)
      return normalizeQuiz(run.quiz, week);
    }
    if (run.status === "failed") {
      throw new Error(run.error ? friendlyRunError(run.error) : "สร้างแบบทดสอบไม่สำเร็จ");
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

/** สร้างควิซจากโจทย์ที่อาจารย์กรอก — เริ่ม job ฝั่ง backend แล้ว poll จนเสร็จ */
export async function generateQuizJSON(
  week: string,
  courseName: string,
  courseCode: string | null,
  prompt: QuizPrompt,
): Promise<Quiz> {
  if (!courseCode) {
    throw new Error("วิชานี้ยังไม่มีรหัสวิชา — กรุณาระบุรหัสวิชาก่อนสร้างแบบทดสอบ");
  }
  const quizRunId = await startQuizGenerate(week, courseName, courseCode, prompt);
  return waitForQuizGenerate(quizRunId, week);
}
