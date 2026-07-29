import type { Quiz } from "./quiz";
import { waitForQuizGenerate } from "./aiQuiz";
import type { SubmitQuizResult } from "./quizGradingApi";

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

   ==========================================================================
   *** punch list ที่ยังต้องทำเพิ่ม (เจอระหว่างต่อ lib/feedbackApi.ts เข้ากับ
   หน้า StudentSummary.tsx) — เรียงตามความสำคัญ ***
   ==========================================================================

   1) [ปิดแล้ว — ไม่ใช่บั๊ก] practice-quiz feedback endpoint คืน 404 ให้ practice
      quiz บางตัว — ทีม backend ตรวจแล้วว่าไม่ใช่บั๊ก: นักเรียนคนนี้ส่งข้อสอบจริง
      2 ครั้ง (2 submission) แต่ละ practice quiz จำ source submission ของตัวเอง
      ถูกต้องอยู่แล้ว แต่ frontend เคยเดา submissionId ผิด (ใช้ submission ล่าสุด
      ของนักเรียนแบบเหมารวมทุกรอบ แทนที่จะใช้ submission ที่ practice quiz รอบนั้น
      อ้างอิงจริง) แก้แล้วในข้อ 4 ด้านล่าง — ดู StudentSummary.tsx

   2) [ปิดแล้ว — deploy แล้ว ยืนยันกับข้อมูลจริงแล้ว] บันทึกคำตอบ/คะแนนของ
      "รอบฝึกซ้อม" เข้า backend ได้แล้ว:

        POST /api/v1/practice-quizzes/{practice_quiz_id}/submissions
          body: { studentId: string, answers: Record<questionId, choiceId|null> }
          → 200 { submissionId, score, total, percent, questions: [...], submittedAt }
            (shape เดียวกับ SubmitQuizResult ใน lib/quizGradingApi.ts ยืนยันแล้ว)
          ตรวจกับ practice-a03017af7c74 จริง ได้ 5/5 ตรงตาม answer key จริง

        GET /api/v1/practice-quizzes/{practice_quiz_id}/submissions/{student_id}
          → 200 SubmitQuizResult[] เรียงล่าสุดก่อน

      ต่อฝั่ง frontend แล้วที่ submitPracticeQuizAnswers/fetchPracticeQuizSubmissions
      ด้านล่าง — StudentQuiz.tsx (โหมดฝึกซ้อมเจาะจุดอ่อน ไม่ใช่โหมดสุ่ม) ส่งคำตอบ
      ขึ้น backend จริงแล้ว ไม่ตรวจในเครื่อง/ไม่เขียน localStorage อีกต่อไป —
      StudentCourseWeeks.tsx และ StudentSummary.tsx อ่านคะแนนจาก backend ตรงๆ
      (lib/practiceHistory.ts ยังอยู่แค่สำหรับโหมดฝึกซ้อมสุ่มที่ไม่มี
      practice_quiz_id จริงให้ผูกกับ backend ได้เท่านั้น)

   3) [ปิดแล้ว — deploy แล้ว ยืนยันกับข้อมูลจริงแล้ว] evidence รายคำถามของรอบ
      ฝึกซ้อม merge เข้า finding เดิมตาม spec ที่ตกลงกันแล้ว (feedbackId เดิม,
      score ไม่ขยับ, practiceRound เป็นเลขรอบจริง) — ยืนยันด้วยข้อมูลจริง:
      practice-a03017af7c74 (รอบ 1) มี evidence q1-q5 ซ้อนกับ q1-q7 เดิมของ
      ควิซจริงต้นทางจริง แยกได้ด้วย practiceRound (1 vs null)

      *** คำเตือนสำคัญจาก backend ที่ frontend ต้องรู้: questionId ไม่ unique
      ข้ามรอบ (AI มินต์ id ใหม่ทุกครั้งที่ generate ไม่ใช่ unique ทั้งระบบ) ***
      ห้าม filter evidence ด้วย questionId เฉย ๆ เด็ดขาด ต้อง filter ด้วย
      questionId + practiceRound คู่กันเสมอ — แก้แล้วใน StudentSummary.tsx
      (ดู activePracticeRound state)

   4) [ปิดแล้ว — deploy แล้ว ยืนยันกับข้อมูลจริงแล้ว] PracticeQuizSummary และ
      GET /practice-quizzes/{id} มี field submissionId แล้ว (ยืนยันด้วย curl
      จริง: practice-a03017af7c74 → submissionId "submission-429909e7ecc3" ซึ่ง
      เป็นคนละตัวกับ submission ที่เคย trigger feedback ไว้ก่อนหน้า — ตรงกับที่
      backend อธิบายไว้ในข้อ 1 พอดี) แก้ฝั่ง frontend แล้วให้ใช้ submissionId
      ของ practice quiz นั้นโดยตรง แทนการเดาจาก submission ล่าสุดของนักเรียน
      (ดู lib/practiceQuizApi.ts: PracticeQuizSummary.submissionId,
      fetchPracticeQuiz().submissionId และ StudentSummary.tsx จุดที่เรียก
      loadPracticeFeedback)
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
  /** submission ทางการที่เป็นต้นกำเนิดของแบบฝึกหัดรอบนี้ — ใช้หา feedbackId ที่
   * ถูกต้องของรอบนี้โดยเฉพาะ (คนละ submission กันได้ถ้านักเรียนเคยส่งข้อสอบจริง
   * มากกว่า 1 ครั้ง อย่าใช้ submission ล่าสุดของนักเรียนแบบเหมารวมเด็ดขาด) */
  submissionId: string | null;
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
export async function fetchPracticeQuiz(practiceQuizId: string): Promise<{
  status: "pending" | "completed" | "failed";
  quiz: Quiz | null;
  /** submission ทางการต้นกำเนิด — ดู PracticeQuizSummary.submissionId */
  submissionId: string | null;
}> {
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

/**
 * ส่งคำตอบของแบบฝึกหัดเจาะจุดอ่อน (target practice) ไปให้ backend ตรวจ+บันทึกจริง
 * — ใช้ได้เฉพาะแบบฝึกหัดที่ backend สร้างให้ (มี practice_quiz_id จริง) เท่านั้น
 * โหมดฝึกซ้อมแบบสุ่ม (mock quiz เจนในเครื่อง) ไม่มี id ให้ส่งแบบนี้ได้
 */
export async function submitPracticeQuizAnswers(params: {
  practiceQuizId: string;
  studentId: string;
  answers: Record<string, string | null>;
}): Promise<SubmitQuizResult> {
  const { practiceQuizId, studentId, answers } = params;
  const res = await fetch(
    `${QUIZ_API_URL}/api/v1/practice-quizzes/${encodeURIComponent(practiceQuizId)}/submissions`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId, answers }),
    },
  );
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, `ส่งคำตอบแบบฝึกหัดไม่สำเร็จ (${res.status})`),
    );
  }
  return res.json();
}

/** ประวัติที่นักเรียนคนนี้เคยทำแบบฝึกหัดรอบนี้ไว้ เรียงล่าสุดก่อน ([]) ถ้ายังไม่เคยทำ */
export async function fetchPracticeQuizSubmissions(
  practiceQuizId: string,
  studentId: string,
): Promise<SubmitQuizResult[]> {
  const res = await fetch(
    `${QUIZ_API_URL}/api/v1/practice-quizzes/${encodeURIComponent(practiceQuizId)}/submissions/${encodeURIComponent(studentId)}`,
  );
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, `โหลดประวัติแบบฝึกหัดไม่สำเร็จ (${res.status})`),
    );
  }
  return res.json();
}
