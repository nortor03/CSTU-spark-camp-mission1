import type { QuizChoice } from "./quiz";
import type { GradedQuestionResult } from "./feedback";

/* ==========================================================================
   จุดเชื่อม backend สำหรับ "นักเรียนทำแบบทดสอบ" — คนละหน้าที่กับ lib/quizzesApi.ts
   (ที่ฝั่งอาจารย์ใช้ดู/แก้ไขทั้งชุดพร้อมเฉลยเต็ม ๆ)

   หลักการ: เครื่องนักเรียนต้อง "ไม่ได้รับเฉลย" มาตั้งแต่แรก
   1. ดึงควิซจาก GET /quizzes/{quiz_id}/for-student — ไม่มี field answer/
      explanation/grounding/sources ติดมาด้วยเลย (มีแค่โจทย์+ตัวเลือก)
   2. ส่งคำตอบไปที่ POST /quizzes/{quiz_id}/submissions — backend เป็นคนถือ
      เฉลยจริง ตรวจเอง และบันทึกผลลง database เอง เครื่องนักเรียนไม่ตรวจเองอีกต่อไป

   ยืนยันแล้วว่า backend สร้างครบทั้ง 4 endpoint จริง (schema เทียบกับ /openapi.json
   ตรงกัน 100%, smoke test ผ่านหมดด้วยข้อมูลจริงในเครื่อง dev):
     - GET  /quizzes/{quiz_id}/for-student
     - POST /quizzes/{quiz_id}/submissions
     - GET  /quizzes/{quiz_id}/submissions/{student_id}   — ประวัติของนักเรียน 1 คน
     - GET  /quizzes/{quiz_id}/submissions                — รายงานทั้งชั้น (ไม่มีเฉลย)

   QuestionResult ต่อข้อ (ทั้งใน POST/GET .../submissions) ตอนนี้แนบ explanation/
   sources มาด้วยแล้ว (ยืนยันจากการยิงจริง) — เป็น null ทั้งคู่สำหรับ submission
   เก่าที่บันทึกไว้ก่อนมี field นี้ (ไม่ error) หน้าผลลัพธ์โชว์ "อ่านเพิ่มเติมที่
   ไฟล์ไหนหน้าไหน" อัตโนมัติเมื่อมีข้อมูล — ดู GradedQuestionResult ใน lib/feedback.ts
   ========================================================================== */

const QUIZ_API_URL = (
  process.env.NEXT_PUBLIC_QUIZ_API_URL ??
  process.env.NEXT_PUBLIC_COURSES_API_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

/** คำถามที่ปลอดภัยส่งให้นักเรียนทำ — ไม่มีเฉลย/คำอธิบายเฉลย/แหล่งอ้างอิงติดมาด้วย */
export interface StudentQuizQuestion {
  id: string;
  type: "mcq";
  question: string;
  choices: QuizChoice[];
  points: number;
  /** ใช้จัดกลุ่มจุดแข็ง/จุดอ่อนรายหัวข้อหลังตรวจ — ไม่ใช่ข้อมูลเฉลย บอกได้ */
  topic?: string;
}

/** ควิซที่ปลอดภัยส่งให้นักเรียนทำ (ก่อนส่งคำตอบ) */
export interface StudentQuiz {
  id: string;
  week: string;
  title: string;
  questions: StudentQuizQuestion[];
}

/** ดึงควิซสำหรับนักเรียนทำ — backend ต้องไม่ส่ง field เฉลยมาด้วยเด็ดขาด */
export async function fetchStudentQuiz(quizId: string): Promise<StudentQuiz> {
  const res = await fetch(
    `${QUIZ_API_URL}/api/v1/quizzes/${encodeURIComponent(quizId)}/for-student`,
  );
  if (!res.ok) {
    throw new Error(`โหลดแบบทดสอบไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}

/** ผลรวมที่ backend ส่งกลับมาหลังตรวจ+บันทึกคำตอบเรียบร้อยแล้ว */
export interface SubmitQuizResult {
  submissionId: string;
  score: number;
  total: number;
  percent: number;
  questions: GradedQuestionResult[];
  submittedAt: string;
}

/**
 * ส่งคำตอบไปให้ backend ตรวจ+บันทึก — เครื่องนักเรียนไม่ตรวจเอง ไม่ถือเฉลยเอง
 * (ต่างจาก gradeQuiz ใน lib/feedback.ts ที่ใช้เฉพาะโหมดฝึกซ้อม)
 */
export async function submitQuizAnswers(params: {
  quizId: string;
  studentId: string;
  answers: Record<string, string | null>;
}): Promise<SubmitQuizResult> {
  const { quizId, studentId, answers } = params;
  const res = await fetch(
    `${QUIZ_API_URL}/api/v1/quizzes/${encodeURIComponent(quizId)}/submissions`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId, answers }),
    },
  );
  if (!res.ok) {
    throw new Error(`ส่งคำตอบไปตรวจไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}

/**
 * ประวัติที่นักเรียนคนนี้เคยทำควิซนี้ไว้ เรียงล่าสุดก่อน ([]) ถ้ายังไม่เคยทำ
 * ใช้ตอนนักเรียนเปิดหน้าแบบทดสอบซ้ำ — ถ้าเคยส่งไปแล้วให้โชว์ผลล่าสุด ([0]) ทันที
 * แทนที่จะปล่อยให้ทำใหม่เงียบๆ โดยไม่รู้ว่าเคยได้คะแนนอะไรไปแล้ว (ทำซ้ำได้ ไม่ block)
 */
export async function fetchStudentSubmissions(
  quizId: string,
  studentId: string,
): Promise<SubmitQuizResult[]> {
  const res = await fetch(
    `${QUIZ_API_URL}/api/v1/quizzes/${encodeURIComponent(quizId)}/submissions/${encodeURIComponent(studentId)}`,
  );
  if (!res.ok) {
    throw new Error(`โหลดประวัติการทำแบบทดสอบไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}

/** ผลสรุป 1 แถวของรายงานชั้นเรียน — ไม่มี per-question breakdown/เฉลย */
export interface SubmissionSummary {
  studentId: string;
  score: number;
  total: number;
  percent: number;
  submittedAt: string;
}

/** ทุกคนที่เคยทำควิซนี้ เรียงล่าสุดก่อน — ใช้หน้ารายงานชั้นเรียนฝั่งอาจารย์ */
export async function fetchQuizSubmissions(
  quizId: string,
): Promise<SubmissionSummary[]> {
  const res = await fetch(
    `${QUIZ_API_URL}/api/v1/quizzes/${encodeURIComponent(quizId)}/submissions`,
  );
  if (!res.ok) {
    throw new Error(`โหลดรายงานชั้นเรียนไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}
