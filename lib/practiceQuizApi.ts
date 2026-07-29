import type { Quiz } from "./quiz";
import { waitForQuizGenerate } from "./aiQuiz";

/* ==========================================================================
   จุดเชื่อม AI สำหรับ "สร้างแบบฝึกหัดเจาะจุดที่พลาด" — นักเรียนกดจากหน้าผลลัพธ์
   หลังทำแบบทดสอบจริงเสร็จ (เฉพาะตอนตอบผิดอย่างน้อย 1 ข้อ) คนละหน้าที่กับ:
     - lib/quizGradingApi.ts   → ตรวจ/บันทึกแบบทดสอบจริง (ต้องไม่มีเฉลยหลุดก่อนส่ง)
     - lib/quizChatApi.ts      → อาจารย์แก้ไขควิซที่มีอยู่ผ่านแชท

   ควิซที่คืนมาจาก endpoint นี้ "มีเฉลยติดมาด้วยได้ตามปกติ" (ไม่ต้อง sanitize แบบ
   /for-student) เพราะเป็นแบบฝึกหัดที่ตรวจ/ให้ feedback ในเครื่องนักเรียนทันที
   (เหมือนโหมดฝึกซ้อมเดิมที่ใช้ generateMockQuiz) ไม่ใช่แบบทดสอบทางการที่ต้อง
   ส่งไปตรวจที่ backend

   ยืนยันแล้วว่า backend สร้างเสร็จจริง (schema เทียบกับ /openapi.json ตรงกัน,
   smoke test ผ่านกับ AI service จริง + ยืนยันเองว่าแบบฝึกหัดไม่หลุดเข้า
   GET /courses/{id}/quizzes ของอาจารย์):

   POST /api/v1/quiz-generate/practice
     body: { submissionId: string, wrongQuestionIds: string[] }
       — backend join เอาเองจาก submissionId ทั้งหมด (quiz/course/CLO/เฉลย/
       explanation) ฝั่ง front ส่งแค่ตัวชี้ ไม่ส่งข้อมูลซ้ำ
     → 202 { quiz_run_id, practice_quiz_id, attempt_number }
       - quiz_run_id ใช้ poll ด้วย GET /api/v1/quiz-generate/{quiz_run_id} ตัวเดิม
         (ไม่มี endpoint poll แยก) ได้ quiz กลับมาแบบเดียวกับ quiz-generate ปกติ
         (มี answer ติดมาด้วย, id ขึ้นต้น "practice-", isActive: false เสมอ)
       - attempt_number: backend นับเองจาก (student_id, source_quiz_id) ไม่ผูกกับ
         submission ครั้งไหนโดยเฉพาะ — ฝั่ง front ไม่ต้องส่งเลขรอบไปเลย

   error ที่ยืนยันแล้ว (shape { error: { code, message } }):
     404 SUBMISSION_NOT_FOUND       — submissionId ไม่มีจริง
     422 VALIDATION_ERROR           — wrongQuestionIds ว่าง
     422 INVALID_QUESTION_IDS       — มี id ที่ไม่ได้อยู่ใน submission นั้น หรือ
                                       เป็นข้อที่ตอบถูกอยู่แล้ว (message บอกละเอียด)

   *** endpoint ใหม่ 2 ตัวด้านล่าง ยังไม่มีจริง (คือ "ข้อ 10" ที่เคยบอกว่าเป็น
   เฟสถัดไป — ตอนนี้ต้องทำแล้ว เพราะนักเรียนอยากเห็นรายการแบบฝึกหัดที่เคยสร้างไว้
   ทั้งหมดในหน้ารายละเอียดวิชา แม้จะยังไม่ได้กดเข้าไปทำก็ตาม) ***

   GET /api/v1/quizzes/{quiz_id}/practice-quizzes?studentId=X
     → 200 PracticeQuizSummary[] เรียงตาม attemptNumber จากน้อยไปมาก:
       { id, attemptNumber, status, title, questionCount, createdAt }
     ไม่เคยสร้างเลย → [] (ไม่ error) quiz_id ไม่มีจริง → 404 QUIZ_NOT_FOUND

   GET /api/v1/practice-quizzes/{practice_quiz_id}
     → 200 { status, quiz } — envelope เดียวกับ GET /quiz-generate/{quiz_run_id}
       (status: "completed" → quiz มีเนื้อหาเต็ม (มี answer), "pending"/"failed" →
       quiz เป็น null) ใช้ตอนนักเรียนกดเปิดแบบฝึกหัดเก่าจากรายการมาทำ/ทบทวนซ้ำ
     practice_quiz_id ไม่มีจริง → 404 PRACTICE_QUIZ_NOT_FOUND
   ========================================================================== */

const QUIZ_API_URL = (
  process.env.NEXT_PUBLIC_QUIZ_API_URL ??
  process.env.NEXT_PUBLIC_COURSES_API_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

interface PracticeGenerateAccepted {
  quiz_run_id: string;
  practice_quiz_id: string;
  attempt_number: number;
}

interface PracticeQuizRequest {
  submissionId: string;
  wrongQuestionIds: string[];
}

/** อ่านข้อความ error จาก body ({error:{code,message}}) ถ้า parse ไม่ได้ค่อย fallback เป็นสถานะ HTTP */
async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    const msg = body?.error?.message;
    return typeof msg === "string" ? msg : fallback;
  } catch {
    return fallback;
  }
}

export interface TargetedPracticeQuiz {
  quiz: Quiz;
  /** รอบที่เท่าไหร่ของการฝึกซ้อมเจาะจุดอ่อนสำหรับควิซต้นทางนี้ (นับโดย backend) */
  attemptNumber: number;
}

/**
 * ขอให้ AI ออกแบบฝึกหัดชุดใหม่ที่เจาะจุดอ่อนจากข้อที่พลาดในรอบก่อน — เริ่ม job
 * แล้ว poll ผลด้วย mechanism เดียวกับ generate/revise ปกติ (waitForQuizGenerate)
 */
export async function generateTargetedPracticeQuiz(params: {
  submissionId: string;
  wrongQuestionIds: string[];
  /** ใช้เป็น key ของควิซที่ได้กลับมาในเครื่องเท่านั้น ไม่ได้ส่งไป backend */
  week: string;
}): Promise<TargetedPracticeQuiz> {
  const { week, ...body } = params;

  const res = await fetch(`${QUIZ_API_URL}/api/v1/quiz-generate/practice`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body satisfies PracticeQuizRequest),
  });
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, `สร้างแบบฝึกหัดเจาะจุดที่พลาดไม่สำเร็จ (${res.status})`),
    );
  }
  const data: PracticeGenerateAccepted = await res.json();
  const quiz = await waitForQuizGenerate(data.quiz_run_id, week);
  return { quiz, attemptNumber: data.attempt_number };
}

/** แถวสรุป 1 แบบฝึกหัดที่นักเรียนคนนี้เคยสร้างไว้จากควิซจริงชุดนี้ (ทำแล้วหรือยังก็ตาม) */
export interface PracticeQuizSummary {
  id: string;
  attemptNumber: number;
  status: "pending" | "completed" | "failed";
  title: string;
  questionCount: number;
  createdAt: string;
}

/** รายการแบบฝึกหัดเจาะจุดที่พลาดทั้งหมดที่นักเรียนคนนี้เคยสร้างจากควิซจริงชุดนี้ */
export async function fetchPracticeQuizzes(
  quizId: string,
  studentId: string,
): Promise<PracticeQuizSummary[]> {
  const url = new URL(`${QUIZ_API_URL}/api/v1/quizzes/${encodeURIComponent(quizId)}/practice-quizzes`);
  url.searchParams.set("studentId", studentId);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, `โหลดรายการแบบฝึกหัดไม่สำเร็จ (${res.status})`),
    );
  }
  return res.json();
}

/** ดึงเนื้อหาเต็มของแบบฝึกหัดที่เคยสร้างไว้ (กดจากรายการมาทำ/ทบทวนซ้ำ) */
export async function fetchPracticeQuiz(
  practiceQuizId: string,
): Promise<{ status: "pending" | "completed" | "failed"; quiz: Quiz | null }> {
  const res = await fetch(
    `${QUIZ_API_URL}/api/v1/practice-quizzes/${encodeURIComponent(practiceQuizId)}`,
  );
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, `โหลดแบบฝึกหัดไม่สำเร็จ (${res.status})`),
    );
  }
  return res.json();
}
