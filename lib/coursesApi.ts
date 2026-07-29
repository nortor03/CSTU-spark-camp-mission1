import type { PlanPayload, PlanPayloadItem } from "./planPayload";
import type { SyllabusClo } from "./syllabus";

/**
 * ดึงรายการสรุปวิชาทั้งหมดจาก backend รายวิชา (GET /api/v1/courses)
 * backend นี้เปิด CORS ให้แล้ว จึงเรียกตรงจากบราวเซอร์ได้ (ไม่ต้อง proxy ผ่าน Next.js server)
 */
const COURSES_API_URL = (
  process.env.NEXT_PUBLIC_COURSES_API_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

/** สรุป 1 วิชา ตามที่ backend ส่งมาในรายการ /api/v1/courses */
export interface CourseSummary {
  course_id: string;
  course_code: string | null;
  subject: string;
  week_count: number;
  topic_count: number;
  /**
   * จำนวนควิซที่ isActive = true ของวิชานี้ (ไม่นับ revision เก่าที่ถูกแทนที่ไปแล้ว)
   * เคยมีบั๊กที่ backend คืนค่า 0 ตายตัว — แก้แล้วและยืนยันกับ backend จริงแล้วว่าถูกต้อง
   * (ทั้งฝั่งอาจารย์และนักเรียนเชื่อ field นี้ตรง ๆ ได้เลย ไม่ต้องนับเองจาก
   * GET /api/v1/courses/{id}/quizzes อีกต่อไป)
   */
  quiz_count: number;
}

interface CourseListResponse {
  items: CourseSummary[];
  total: number;
  limit: number;
  offset: number;
}

/** วิชาแบบเต็ม (พร้อม CLO/หัวข้อ) ที่ backend คืนมาจาก POST/PUT /api/v1/courses */
export interface CourseOut {
  course_id: string;
  course_code: string | null;
  subject: string;
  clos: SyllabusClo[];
  items: PlanPayloadItem[];
  created_at: string;
  updated_at: string;
}

export async function fetchCourses(): Promise<CourseSummary[]> {
  const res = await fetch(`${COURSES_API_URL}/api/v1/courses`);
  if (!res.ok) {
    throw new Error(`โหลดรายวิชาไม่สำเร็จ (${res.status})`);
  }
  const data: CourseListResponse = await res.json();
  return data.items;
}

/**
 * ส่งแผนการสอน (subject/clos/items) ที่จัดเสร็จแล้วไปสร้างวิชาใหม่ที่ backend
 * (POST /api/v1/courses) — backend เป็นคน gen course_id ให้เอง
 */
export async function createCourse(payload: PlanPayload): Promise<CourseOut> {
  const res = await fetch(`${COURSES_API_URL}/api/v1/courses`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`บันทึกวิชาไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}

/** โหลดวิชา 1 รายการแบบเต็ม (CLO/หัวข้อ) จาก backend (GET /api/v1/courses/{id}) */
export async function fetchCourse(courseId: string): Promise<CourseOut> {
  const res = await fetch(
    `${COURSES_API_URL}/api/v1/courses/${encodeURIComponent(courseId)}`,
  );
  if (!res.ok) {
    throw new Error(`โหลดวิชาไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}

/**
 * บันทึกวิชาที่มี course_id อยู่แล้ว (upsert เต็มรูปแบบ — แทนที่ CLO/หัวข้อเดิม
 * ทั้งหมดด้วยของใน payload) ผ่าน PUT /api/v1/courses/{id} — ใช้ตอน re-sync
 * วิชาที่มีอยู่แล้ว ต่างจาก createCourse ตรงที่ผู้เรียกเป็นคนกำหนด course_id เอง
 */
export async function syncCourse(
  courseId: string,
  payload: PlanPayload,
): Promise<CourseOut> {
  const res = await fetch(
    `${COURSES_API_URL}/api/v1/courses/${encodeURIComponent(courseId)}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    throw new Error(`บันทึกวิชาไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}

/** ลบวิชา (พร้อม CLO/หัวข้อทั้งหมดของวิชานั้น) ออกจาก backend */
export async function deleteCourse(courseId: string): Promise<void> {
  const res = await fetch(
    `${COURSES_API_URL}/api/v1/courses/${encodeURIComponent(courseId)}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    throw new Error(`ลบวิชาไม่สำเร็จ (${res.status})`);
  }
}
