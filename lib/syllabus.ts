/**
 * type ต่อไปนี้ตรงกับ schema จริงของ backend (ดูจาก /openapi.json ของ
 * AI Read Courses service) — หลายฟิลด์เป็น nullable เพราะ backend
 * ตั้งใจให้ null เมื่อเอกสารไม่ได้ระบุค่านั้นไว้ตรงๆ (กันการเดามั่ว)
 */

/** ผลลัพธ์การเรียนรู้ 1 ข้อ (Course Learning Outcome) ที่แกะได้จาก syllabus */
export interface SyllabusClo {
  code: string;
  /** null = เอกสารไม่ได้ระบุคำอธิบายของ CLO นี้ไว้ */
  description: string | null;
}

/** กิจกรรมการประเมินผล 1 รายการ (เช่น quiz, การบ้าน, โปรเจกต์) */
export interface SyllabusAssessmentActivity {
  name: string;
  /** สัปดาห์ที่เกิดกิจกรรมนี้ ตามข้อความเดิมในเอกสาร เช่น "3-7, 9, 11, 14" — null ถ้าไม่ระบุ */
  weeks: string | null;
  related_clos: string[];
  /** null ถ้าเอกสารไม่ได้ระบุสัดส่วนคะแนนของกิจกรรมนี้ */
  weight_percent: number | null;
}

/**
 * หัวข้อการสอน 1 รายการ — อาจผูกกับสัปดาห์หรือไม่ก็ได้
 * (เช่น แถวที่มีแต่เลขสัปดาห์ไม่มีหัวข้อ หรือหัวข้อทั่วไปที่ไม่ได้ระบุสัปดาห์)
 */
export interface SyllabusWeekItem {
  /** null = แถวนี้ไม่ได้ระบุสัปดาห์ */
  week_number: number | null;
  /** null = สัปดาห์นี้มีเลขแต่ไม่มีชื่อหัวข้อระบุไว้ */
  topic: string | null;
  related_clos: string[];
}

/** ผลลัพธ์ทั้งหมดจากการแยกข้อมูล course syllabus */
export interface SyllabusExtraction {
  /** null = เอกสารไม่ได้ระบุรหัสวิชาไว้ */
  course_code: string | null;
  has_weekly_schedule: boolean;
  clos: SyllabusClo[];
  assessment_activities: SyllabusAssessmentActivity[];
  items: SyllabusWeekItem[];
}

/**
 * ส่งไฟล์ course syllabus (PDF) ไปแยก CLO/ตารางสอน/เกณฑ์การประเมิน
 * เรียกผ่าน /api/syllabus-extractions (same-origin) ซึ่งจะ proxy ต่อไปยัง backend จริง
 * ที่อยู่ SYLLABUS_API_URL — ไม่เรียก backend ตรงจากบราวเซอร์ เพราะ backend ยังไม่ได้เปิด CORS ให้
 */
export async function extractSyllabus(
  file: File,
): Promise<SyllabusExtraction> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/syllabus-extractions", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`แยกข้อมูล syllabus ไม่สำเร็จ (${res.status})`);
  }

  return res.json();
}
