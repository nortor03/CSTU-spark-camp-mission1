import type { QuizSource } from "./quiz";

/* ==========================================================================
   จุดเชื่อม backend สำหรับ "วิเคราะห์ผลการทำแบบทดสอบ" (จุดแข็ง/จุดอ่อน/findings
   ราย CLO) — ยืนยันแล้วว่า deploy จริง ทดสอบกับ AI service (tonlabkit-agent)
   จริงแล้ว (POST /v1/analyses/learner-week คืน 202 จริง) คนละหน้าที่กับ:
     - lib/quizGradingApi.ts   → ตรวจคำตอบ+ให้คะแนนต่อข้อ
     - lib/practiceQuizApi.ts → สร้างแบบฝึกหัดเจาะจุดที่พลาด
   ไฟล์นี้แทนที่ overallFeedback() แบบ template เดิมใน lib/feedback.ts (if/else
   ตามช่วงคะแนนล้วน ๆ) ด้วยผลวิเคราะห์จริงจาก backend

   Flow: หลัง submitQuizAnswers สำเร็จ → POST .../feedback ด้วย submissionId
   (เริ่ม/ต่อ job วิเคราะห์ — idempotent เรียกซ้ำได้ ได้ feedbackId เดิมเสมอ) →
   poll ด้วย feedbackId ผ่าน endpoint เดียวกับที่ใช้เปิดดูซ้ำทีหลัง (ไม่มี job id
   แยกต่างหากแบบ quiz-generate) — ต่างจาก draft spec รอบแรกตรงที่ trigger กับ
   poll/เปิดซ้ำ "คนละ endpoint กัน" แต่ "ใช้ feedbackId เดียวกันได้เลย" ไม่ต้องมี
   job id คนละตัว

   POST /api/v1/submissions/{submission_id}/feedback
     body: {}
     → 202 { feedbackId, status: "pending" }
     idempotent: เรียกซ้ำตอน pending/completed → feedbackId เดิม ไม่เริ่ม run ใหม่
     เรียกซ้ำหลัง run ก่อนหน้า fail ไปแล้ว → เริ่ม run ใหม่ แต่ feedbackId เดิม
     404 SUBMISSION_NOT_FOUND — submission_id ไม่มีจริง
     รับได้ทั้ง submissionId ของข้อสอบจริง (official) และของรอบฝึกซ้อม (practice
     submissionId จาก SubmitQuizResult ตอน submitPracticeQuizAnswers) — backend
     ตรวจแยกอัตโนมัติ (official ก่อน ไม่เจอค่อย fallback ไป practice) ยืนยันแล้ว
     ด้วยข้อมูลจริง: practice-submission-a55702274842 → feedbackId ใหม่ของตัวเอง
     คนละก้อนกับ feedback ของ submission ทางการ

   GET /api/v1/quizzes/{quiz_id}/feedback/{feedback_id}
     → ใช้ทั้ง poll (หลัง trigger) และเปิดดูซ้ำ (นักเรียนกลับมาเปิดหน้าผลลัพธ์
     แบบทดสอบจริงอีกครั้ง) — response เดียวกันทั้งสองกรณี ดู FeedbackStatus
     404 FEEDBACK_NOT_FOUND — feedback_id ไม่มีจริง หรือไม่ตรงกับ quiz_id นี้

   GET /api/v1/quizzes/{quiz_id}/practice-quizzes/{practice_quiz_id}/feedback/{feedback_id}
     → ใช้ตอนนักเรียนเปิดหน้าผลลัพธ์ของ "แบบฝึกหัดเจาะจุดอ่อน" — คืนผลวิเคราะห์
     ของรอบนั้นตรงๆ (เดิมเคย merge evidence เข้า feedback ของ base quiz โดยคะแนน
     ไม่ขยับ แต่เปลี่ยน spec แล้ว: แต่ละรอบฝึกซ้อมมี feedbackId/คะแนน CLO เป็นของ
     ตัวเอง วิเคราะห์เฉพาะคำถามของรอบนั้นจริง — CLO ที่คำถามรอบนั้นไม่แตะจะไม่มี
     finding กลับมาเลย ไม่ใช่ 0) ยืนยันด้วยข้อมูลจริงแล้วว่า evidence[].practiceRound
     ตรงกับรอบที่วิเคราะห์เสมอ (เช่น practice-76d94ac8747a รอบ 2 → evidence ทุกชิ้น
     practiceRound: 2) จึงยังกรองด้วย practiceRound ต่อใน StudentSummary.tsx ได้
     404 FEEDBACK_NOT_FOUND — เหมือนด้านบน แต่เช็ค practice_quiz_id ด้วย
   ========================================================================== */

const FEEDBACK_API_URL = (
  process.env.NEXT_PUBLIC_QUIZ_API_URL ??
  process.env.NEXT_PUBLIC_COURSES_API_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

const POLL_INTERVAL_MS = 2500;

/**
 * หลักฐานประกอบ finding รายข้อ 1 ชิ้น — มี 2 kind ที่รู้จักตอนนี้:
 *   "quiz" — มาจากคำตอบข้อสอบ 1 ข้อ (มี questionId/chosenChoiceId/correctChoiceId/
 *            correct ตัวเต็ม, span เป็น null)
 *   "note" — มาจากบันทึกสรุปที่นักเรียนเขียนเองสัปดาห์นั้น (มี span เป็นข้อความที่
 *            ยกมาจากบันทึก ส่วนฟิลด์ที่เกี่ยวกับคำถามข้อสอบจะไม่มี/เป็น null)
 * ฟิลด์เฉพาะควิซประกาศเป็น optional เพราะยังไม่เคยเห็น evidence kind "note" จริงจาก
 * backend (มีแต่ตัวอย่างที่ทีมส่งมา) — เขียนแบบกันเหนียวไว้ก่อน
 */
export interface FeedbackEvidence {
  kind: string;
  questionId?: string | null;
  /** รอบของแบบฝึกหัดฝึกซ้อม ถ้าหลักฐานนี้มาจากควิซจริง (ไม่ใช่ practice) จะเป็น null */
  practiceRound?: number | null;
  chosenChoiceId?: string | null;
  correctChoiceId?: string | null;
  correct?: boolean | null;
  topicTags: string[];
  sources: QuizSource[];
  /** ข้อความที่ยกมาจากบันทึกสรุปของนักเรียน — มีเฉพาะ evidence ที่ kind === "note" */
  span?: string | null;
  comment: string;
}

/** ผลวิเคราะห์ราย CLO 1 รายการ */
export interface FeedbackFinding {
  learnerId: string;
  weekNumber: number;
  cloCode: string;
  score: number;
  evidence: FeedbackEvidence[];
}

/** ผลวิเคราะห์ภาพรวมหลังตรวจแบบทดสอบ 1 ครั้ง */
export interface FeedbackResult {
  id: string;
  submissionId: string;
  /** ข้อความสรุปจุดแข็ง (ความยาวเป็นย่อหน้า ไม่ใช่ list) */
  strengths: string;
  /** ข้อความสรุปจุดอ่อน (ความยาวเป็นย่อหน้า ไม่ใช่ list) */
  weaknesses: string;
  findings: FeedbackFinding[];
  createdAt: string;
}

/** สถานะการวิเคราะห์ ณ ขณะนี้ — ใช้ได้ทั้งตอน poll (หลัง trigger) และตอนเปิดดูซ้ำ */
export interface FeedbackStatus {
  status: "pending" | "completed" | "failed";
  feedback: FeedbackResult | null;
  error?: string | null;
}

interface TriggerFeedbackResponse {
  feedbackId: string;
  status: "pending";
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * เริ่ม/ต่อ job วิเคราะห์ feedback จาก submission — idempotent เรียกซ้ำได้เสมอ
 * (ได้ feedbackId เดิมกลับมาไม่ว่าจะ pending/completed/เคย fail ไปแล้ว)
 */
export async function triggerFeedbackAnalysis(
  submissionId: string,
): Promise<TriggerFeedbackResponse> {
  const res = await fetch(
    `${FEEDBACK_API_URL}/api/v1/submissions/${encodeURIComponent(submissionId)}/feedback`,
    { method: "POST", headers: { "content-type": "application/json" } },
  );
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, `เริ่มวิเคราะห์ผลไม่สำเร็จ (${res.status})`),
    );
  }
  return res.json();
}

/** ดึงสถานะ/ผลวิเคราะห์ของแบบทดสอบจริง (base quiz) */
export async function fetchFeedbackStatus(
  quizId: string,
  feedbackId: string,
): Promise<FeedbackStatus> {
  const res = await fetch(
    `${FEEDBACK_API_URL}/api/v1/quizzes/${encodeURIComponent(quizId)}/feedback/${encodeURIComponent(feedbackId)}`,
  );
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, `โหลดผลวิเคราะห์ไม่สำเร็จ (${res.status})`),
    );
  }
  return res.json();
}

/** ดึงสถานะ/ผลวิเคราะห์ของแบบฝึกหัดเจาะจุดอ่อน (feedback ก้อนเดิมจาก base quiz) */
export async function fetchPracticeFeedbackStatus(
  quizId: string,
  practiceQuizId: string,
  feedbackId: string,
): Promise<FeedbackStatus> {
  const res = await fetch(
    `${FEEDBACK_API_URL}/api/v1/quizzes/${encodeURIComponent(quizId)}/practice-quizzes/${encodeURIComponent(practiceQuizId)}/feedback/${encodeURIComponent(feedbackId)}`,
  );
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, `โหลดผลวิเคราะห์ไม่สำเร็จ (${res.status})`),
    );
  }
  return res.json();
}

/** poll ด้วย fetcher ที่ส่งเข้ามาทุก 2500ms ไม่มี timeout จนกว่าจะ completed (คืน feedback) หรือ failed (throw) */
async function waitForFeedback(
  fetchStatus: () => Promise<FeedbackStatus>,
): Promise<FeedbackResult> {
  while (true) {
    const s = await fetchStatus();
    if (s.status === "completed" && s.feedback) return s.feedback;
    if (s.status === "failed") {
      throw new Error(s.error ?? "วิเคราะห์ผลไม่สำเร็จ");
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

/**
 * เริ่มวิเคราะห์ feedback จาก submission แล้ว poll จนเสร็จ — เรียกทันทีหลัง
 * submitQuizAnswers สำเร็จ (หรือตอนเปิดผลแบบทดสอบจริงที่เคยส่งไปแล้วซ้ำ ก็เรียกซ้ำ
 * ได้เพราะ trigger เป็น idempotent)
 */
export async function analyzeSubmissionFeedback(
  submissionId: string,
  quizId: string,
): Promise<FeedbackResult> {
  const { feedbackId } = await triggerFeedbackAnalysis(submissionId);
  return waitForFeedback(() => fetchFeedbackStatus(quizId, feedbackId));
}

/** ดึง feedback ที่วิเคราะห์ไว้แล้วมาโชว์ที่หน้าแบบฝึกหัดเจาะจุดอ่อน (poll เผื่อยังไม่เสร็จ) */
export async function loadPracticeFeedback(
  quizId: string,
  practiceQuizId: string,
  feedbackId: string,
): Promise<FeedbackResult> {
  return waitForFeedback(() =>
    fetchPracticeFeedbackStatus(quizId, practiceQuizId, feedbackId),
  );
}
