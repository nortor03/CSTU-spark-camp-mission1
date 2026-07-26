import type { Topic } from "./types";
import { weekNumber } from "./weeks";

/**
 * โครงข้อมูล 1 หัวข้อ ที่จะส่งไป backend ตอนกด "ยืนยันและส่งข้อมูล"
 * จงใจให้หน้าตาตรงกับ SyllabusItem ที่ backend ส่งมาตอน extract syllabus
 * (week_number/topic/related_clos) เพื่อให้ endpoint ฝั่ง save รับ-คืนรูปแบบเดียวกันได้
 */
export interface PlanPayloadItem {
  topic_id: string;
  week_number: number | null;
  topic: string;
  related_clos: string[];
  /** true = ยังเป็นข้อความที่ AI เสนอมา, false = ครูแก้ไข/พิมพ์เองแล้ว */
  ai_generated: boolean;
}

/** payload ทั้งชุดของ 1 วิชา พร้อมส่งให้ backend บันทึกแผนการสอน */
export interface PlanPayload {
  course_id: string;
  course_code: string | null;
  subject: string;
  items: PlanPayloadItem[];
}

/** ประกอบ payload จากสถานะปัจจุบันของวิชาที่ active */
export function buildPlanPayload(
  courseId: string,
  courseCode: string | null,
  subject: string,
  topics: Topic[],
): PlanPayload {
  return {
    course_id: courseId,
    course_code: courseCode,
    subject,
    items: topics.map((t) => ({
      topic_id: t.id,
      week_number: t.weekAssigned ? Number(weekNumber(t.weekAssigned)) : null,
      topic: t.title,
      related_clos: t.relatedClos ?? [],
      ai_generated: t.aiGenerated,
    })),
  };
}
