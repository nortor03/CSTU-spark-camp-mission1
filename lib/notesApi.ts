import { weekNumber } from "./weeks";

/* ==========================================================================
   จุดเชื่อม backend สำหรับ "บันทึกสรุป/สิ่งที่ยังไม่เข้าใจ" ของนักเรียนรายสัปดาห์
   (components/student/StudentCourseWeeks.tsx) — ตอนนี้เก็บแค่ localStorage
   ในเครื่อง ทำให้เห็นได้แค่เครื่องเดียว/browser เดียว ต้องการให้ backend เก็บไว้ด้วย
   เพื่อให้ข้ามเครื่องได้ (และในอนาคตอาจารย์อยากเห็นบันทึกของนักเรียนก็ทำได้)

   *** endpoint นี้เป็นของใหม่ ยังไม่มีจริงใน backend — spec ที่ต้องการ: ***

   PUT /api/v1/courses/{course_id}/notes/{week}
     body: { studentId: string, text: string }
     → upsert บันทึกของนักเรียนคนนี้ สัปดาห์นี้ ทับของเดิมถ้ามีอยู่แล้ว
     → 200 { text: string, updatedAt: string }
     course_id ไม่มีจริง → 404 COURSE_NOT_FOUND

   GET /api/v1/courses/{course_id}/notes/{week}?studentId=X
     → 200 { text: string, updatedAt: string | null }
       ไม่เคยบันทึกเลย → { text: "", updatedAt: null } (ไม่ error/ไม่ 404)
     course_id ไม่มีจริง → 404 COURSE_NOT_FOUND

   หมายเหตุ: ยังคง localStorage ไว้เป็นค่าตั้งต้น/fallback เสมอ — เขียนลงเครื่อง
   ก่อนทันที (UX ไว) แล้วค่อย sync ขึ้น backend แบบ best-effort เหมือน
   saveQuizToBackend ใน lib/quizzesApi.ts ถ้า backend ล่ม/เข้าไม่ถึง ก็ยังใช้
   งานต่อได้ปกติในเครื่องนี้
   ========================================================================== */

const NOTES_API_URL = (
  process.env.NEXT_PUBLIC_QUIZ_API_URL ??
  process.env.NEXT_PUBLIC_COURSES_API_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

export interface CourseWeekNote {
  text: string;
  updatedAt: string | null;
}

/** ดึงบันทึกของนักเรียนคนนี้สำหรับสัปดาห์นี้ — ไม่เคยบันทึกเลยก็คืนค่าว่าง ไม่ error */
export async function fetchWeekNote(
  courseId: string,
  week: string,
  studentId: string,
): Promise<CourseWeekNote> {
  const url = new URL(
    `${NOTES_API_URL}/api/v1/courses/${encodeURIComponent(courseId)}/notes/${weekNumber(week)}`,
  );
  url.searchParams.set("studentId", studentId);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`โหลดบันทึกไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}

/** บันทึก/แก้ไขบันทึกของนักเรียนคนนี้สำหรับสัปดาห์นี้ (upsert ทับของเดิม) */
export async function saveWeekNote(
  courseId: string,
  week: string,
  studentId: string,
  text: string,
): Promise<CourseWeekNote> {
  const res = await fetch(
    `${NOTES_API_URL}/api/v1/courses/${encodeURIComponent(courseId)}/notes/${weekNumber(week)}`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId, text }),
    },
  );
  if (!res.ok) {
    throw new Error(`บันทึกไม่สำเร็จ (${res.status})`);
  }
  return res.json();
}
