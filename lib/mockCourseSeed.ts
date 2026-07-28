import type { Topic } from "./types";
import type { SyllabusExtraction } from "./syllabus";
import type { Quiz } from "./quiz";
import { MOCK_AI_TOPICS } from "./mockTopics";
import { MOCK_CLOS, generateMockQuiz, emptyPrompt } from "./quiz";

/**
 * สวิตช์โหมดพรีวิว mock — ตั้ง `true` ชั่วคราวระหว่างทำ/ทดลอง UI–UX
 * เพื่อให้สร้างวิชาแล้วมีข้อมูลจำลองให้ดู/แก้ทันที
 *
 * ตั้งเป็น `false` เมื่อหลังบ้านจริงพร้อม — ระบบจะกลับไปใช้ syllabus extraction จริง
 * และถ้าเปิดไม่ได้/ไม่มีข้อมูล ก็จะขึ้น "สถานะว่าง" ตามปกติ (ไม่ fallback มาที่ mock)
 */
export const USE_MOCK_COURSE_PREVIEW = true;

let seedCounter = 0;
function sid(prefix: string): string {
  seedCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${seedCounter}`;
}

export interface MockCourseSeed {
  topics: Topic[];
  extraction: SyllabusExtraction;
  quizzes: Record<string, Quiz[]>;
}

/**
 * ข้อมูลจำลองทั้งวิชา — ใช้ตอน "สร้างรายวิชา" เพื่อให้หน้าจัดหัวข้อ (/topics)
 * และหน้ารายละเอียดวิชา (/course/[id]) มีเนื้อหาให้ดู/แก้ได้ทันที
 * (ชั่วคราว: ยังไม่เชื่อมหลังบ้านจริง — เอาไว้ดู/ปรับดีไซน์ก่อน)
 */
export function buildMockCourseSeed(
  syllabusName: string | null,
  courseCode = "CN101",
  subject = "การเขียนโปรแกรมเบื้องต้น",
  totalWeeks = 12,
  quizWeeks = 2,
): MockCourseSeed {
  const file = syllabusName ?? "Course Syllabus";

  // หัวข้อ — จัดเข้าสัปดาห์ที่ 1..N ให้เลย (หน้ารายละเอียดวิชาจะได้เห็นเป็นแถวสัปดาห์)
  const topics: Topic[] = [];
  for (let i = 0; i < totalWeeks; i++) {
    const baseTopic = MOCK_AI_TOPICS[i % MOCK_AI_TOPICS.length];
    const suffix = i >= MOCK_AI_TOPICS.length ? ` (${Math.floor(i / MOCK_AI_TOPICS.length) + 1})` : "";
    topics.push({
      id: sid("t"),
      title: `${baseTopic.title}${suffix}`,
      file,
      selected: false,
      weekAssigned: `สัปดาห์ที่ ${i + 1}`,
      aiGenerated: true,
    });
  }

  // CLO — แยก "CLO n: คำอธิบาย" เป็น code + description
  const clos = MOCK_CLOS.map((line) => {
    const idx = line.indexOf(":");
    return idx > 0
      ? {
          code: line.slice(0, idx).trim(),
          description: line.slice(idx + 1).trim(),
        }
      : { code: line.trim(), description: null };
  });

  const extraction: SyllabusExtraction = {
    course_code: courseCode,
    has_weekly_schedule: true,
    clos,
    assessment_activities: [],
    items: topics.map((t, i) => ({
      week_number: i + 1,
      topic: t.title,
      related_clos: [],
    })),
  };

  // ควิซตัวอย่าง — ใส่ให้ quizWeeks สัปดาห์แรก เพื่อให้หน้ารายละเอียดวิชาเห็น accordion ควิซ
  const quizzes: Record<string, Quiz[]> = {};
  for (let i = 0; i < quizWeeks; i++) {
    const week = `สัปดาห์ที่ ${i + 1}`;
    const q = generateMockQuiz(week, {
      ...emptyPrompt(),
      topics: [topics[i].title],
      count: 5,
    });
    q.isActive = true;
    q.title = `แบบทดสอบ ${topics[i].title}`;
    quizzes[week] = [q];
  }

  return { topics, extraction, quizzes };
}
