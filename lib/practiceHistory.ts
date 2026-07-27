import type { Quiz } from "./quiz";
import type { StudentAnswers } from "./feedback";

/**
 * ประวัติการ "ฝึกซ้อม" ของนักเรียน (เก็บใน localStorage ฝั่ง client เท่านั้น)
 * แยกจากผลทางการ (submissions) — ไม่กระทบสรุป/รายงานของอาจารย์
 * เก็บ snapshot ของควิซ + คำตอบ เพื่อให้ย้อนดูผลได้ทุกรอบ
 */
export interface PracticeAttempt {
  id: string;
  /** ISO timestamp */
  at: string;
  score: number;
  total: number;
  percent: number;
  /** ชุดคำถามของรอบนั้น (เจนใหม่ทุกครั้ง) */
  quiz: Quiz;
  /** คำตอบที่นักเรียนเลือกในรอบนั้น */
  answers: StudentAnswers;
}

function storageKey(
  studentId: string | null,
  courseId: string | null,
  week: string,
): string {
  return `tonlabkit:practice:${studentId ?? "anon"}:${courseId ?? "none"}:${week}`;
}

/** อ่านประวัติฝึกซ้อมของสัปดาห์หนึ่ง (เรียงจากรอบแรก → ล่าสุด) */
export function getPracticeHistory(
  studentId: string | null,
  courseId: string | null,
  week: string,
): PracticeAttempt[] {
  try {
    const raw = localStorage.getItem(storageKey(studentId, courseId, week));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PracticeAttempt[]) : [];
  } catch {
    return [];
  }
}

/** บันทึกผลฝึกซ้อม 1 รอบ ต่อท้ายประวัติ */
export function savePracticeAttempt(
  studentId: string | null,
  courseId: string | null,
  week: string,
  attempt: PracticeAttempt,
): void {
  try {
    const list = getPracticeHistory(studentId, courseId, week);
    list.push(attempt);
    localStorage.setItem(
      storageKey(studentId, courseId, week),
      JSON.stringify(list),
    );
  } catch {
    /* localStorage ไม่พร้อม — ข้าม */
  }
}
