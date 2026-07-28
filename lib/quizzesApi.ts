import type { Quiz, QuizQuestion } from "./quiz";
import { weekNumber } from "./weeks";

/**
 * client สำหรับ backend ควิซ (POST/GET /api/v1/quizzes, GET .../courses/{id}/quizzes)
 * schema ยืนยันจาก /openapi.json ของ backend เอง — QuizSaveRequest/FrontendQuiz/
 * FrontendQuestion (บังคับให้ explanation/relatedClos/topicTags/grounding/sources
 * ต้องมีเสมอ แม้คำถามที่อาจารย์เพิ่มเองจะไม่มีข้อมูล AI ก็ต้องส่งเป็นค่าว่างแทน undefined)
 */
const QUIZZES_API_URL = (
  process.env.NEXT_PUBLIC_QUIZ_API_URL ??
  process.env.NEXT_PUBLIC_COURSES_API_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

/** เติมฟิลด์ที่ backend บังคับต้องมีด้วยค่าว่าง เผื่อคำถามที่อาจารย์เพิ่ม/แก้เองไม่มีข้อมูล AI */
function toFrontendQuestion(q: QuizQuestion) {
  return {
    id: q.id,
    type: q.type,
    question: q.question,
    choices: q.choices,
    answer: q.answer,
    points: q.points,
    topic: q.topic ?? "",
    explanation: q.explanation ?? "",
    relatedClos: q.relatedClos ?? [],
    topicTags: q.topicTags ?? [],
    grounding: q.grounding ?? "",
    sources: q.sources ?? [],
  };
}

/** exported ไว้ให้ lib/quizChatApi.ts ใช้ซ้ำตอนส่ง previousQuiz (ต้อง shape เดียวกัน) */
export function toFrontendQuiz(quiz: Quiz) {
  return {
    id: quiz.id,
    isActive: quiz.isActive,
    revision: quiz.revision,
    week: quiz.week,
    title: quiz.title,
    questions: quiz.questions.map(toFrontendQuestion),
  };
}

/**
 * backend คืน quiz.week เป็นเลขล้วน ๆ เสมอ (เช่น "3") — derive จาก week (int) ที่ query/ส่งไป
 * ไม่สนใจ string ที่ส่งไปใน quiz.week ตอน save เลย ต้องแปลงกลับเป็น "สัปดาห์ที่ N"
 * ให้ตรงกับ key ภายในของเรา ก่อนเอาไปใช้ต่อทุกครั้งที่อ่านจาก backend
 */
function toInternalWeek(rawWeek: string): string {
  return /^\d+$/.test(rawWeek) ? `สัปดาห์ที่ ${rawWeek}` : rawWeek;
}

function toInternalQuiz(raw: Quiz): Quiz {
  return { ...raw, week: toInternalWeek(raw.week) };
}

/**
 * บันทึกควิซที่อาจารย์ยืนยันแล้ว (POST /api/v1/quizzes)
 * save ซ้ำด้วย id เดิม = แก้ไข ไม่สร้างซ้ำ — 201 ไม่มี body (แค่ยืนยันว่าสร้างใหม่),
 * 200 คืน FrontendQuiz ที่บันทึกไว้จริง (กรณีทับของเดิม)
 */
export async function saveQuizToBackend(
  courseId: string,
  week: string,
  quiz: Quiz,
): Promise<Quiz> {
  const res = await fetch(`${QUIZZES_API_URL}/api/v1/quizzes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      courseId,
      week: Number(weekNumber(week)),
      quiz: toFrontendQuiz(quiz),
    }),
  });
  if (!res.ok) {
    throw new Error(`บันทึกแบบทดสอบไม่สำเร็จ (${res.status})`);
  }
  if (res.status === 201) return quiz; // สร้างใหม่สำเร็จ แต่ backend ไม่ส่ง body กลับมา
  return toInternalQuiz(await res.json());
}

/** ดึงควิซเดียวด้วย id ที่ backend มินต์ไว้ตอน generate (GET /api/v1/quizzes/{quiz_id}) */
export async function fetchQuizById(quizId: string): Promise<Quiz> {
  const res = await fetch(
    `${QUIZZES_API_URL}/api/v1/quizzes/${encodeURIComponent(quizId)}`,
  );
  if (!res.ok) {
    throw new Error(`โหลดแบบทดสอบไม่สำเร็จ (${res.status})`);
  }
  return toInternalQuiz(await res.json());
}

/**
 * list ควิซทั้งหมดของวิชา กรองตามสัปดาห์ได้ (GET /api/v1/courses/{course_id}/quizzes?week=N)
 * — นี่คือตัวที่หน้าบ้านใช้ดึงมาโชว์ (ไม่ส่ง week = ดึงทุกสัปดาห์)
 */
export async function fetchCourseQuizzes(
  courseId: string,
  week?: string,
): Promise<Quiz[]> {
  const url = new URL(
    `${QUIZZES_API_URL}/api/v1/courses/${encodeURIComponent(courseId)}/quizzes`,
  );
  if (week) url.searchParams.set("week", weekNumber(week));
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`โหลดรายการแบบทดสอบไม่สำเร็จ (${res.status})`);
  }
  const list: Quiz[] = await res.json();
  return list.map(toInternalQuiz);
}
