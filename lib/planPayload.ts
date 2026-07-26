import type { SyllabusClo } from "./syllabus";
import type { Topic } from "./types";
import { weekNumber } from "./weeks";

/**
 * โครงข้อมูล 1 หัวข้อ ที่จะส่งไป backend ตอนกด "ยืนยันและส่งข้อมูล"
 * ไม่ส่ง topic_id/course_id — backend เป็นคน gen ให้เอง
 */
export interface PlanPayloadItem {
  week_number: number | null;
  topic: string;
  related_clos: string[];
}

/** payload ทั้งชุดของ 1 วิชา พร้อมส่งให้ backend บันทึกแผนการสอน */
export interface PlanPayload {
  course_code: string | null;
  subject: string;
  clos: SyllabusClo[];
  items: PlanPayloadItem[];
}

/** ประกอบ payload จากสถานะปัจจุบันของวิชาที่ active */
export function buildPlanPayload(
  courseCode: string | null,
  subject: string,
  clos: SyllabusClo[],
  topics: Topic[],
): PlanPayload {
  return {
    course_code: courseCode,
    subject,
    clos,
    items: topics.map((t) => ({
      week_number: t.weekAssigned ? Number(weekNumber(t.weekAssigned)) : null,
      topic: t.title,
      related_clos: t.relatedClos ?? [],
    })),
  };
}
