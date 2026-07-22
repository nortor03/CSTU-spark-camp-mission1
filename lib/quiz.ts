import { MOCK_AI_TOPICS } from "./mockTopics";

/** ตัวเลือกของคำถามปรนัย */
export interface QuizChoice {
  id: string;
  text: string;
}

/** คำถาม 1 ข้อ (ตอนนี้รองรับเฉพาะปรนัย/เลือกตอบ) */
export interface QuizQuestion {
  id: string;
  /** ชนิดคำถาม — ปัจจุบันมีเฉพาะ "mcq" (ปรนัย) */
  type: "mcq";
  question: string;
  choices: QuizChoice[];
  /** id ของตัวเลือกที่เป็นคำตอบที่ถูก */
  answer: string;
  points: number;
  /**
   * หัวข้อต้นทางของคำถามข้อนี้ — ใช้สรุปจุดแข็ง/จุดอ่อนรายหัวข้อ
   * optional เพราะควิซที่บันทึกไว้ก่อนหน้านี้ยังไม่มีฟิลด์นี้
   */
  topic?: string;
}

/** โจทย์ที่อาจารย์กรอกเพื่อสั่ง generate */
export interface QuizPrompt {
  /** ผลลัพธ์การเรียนรู้ (Course Learning Outcome) */
  clo: string[];
  /** หัวข้อที่จะทดสอบ (ชื่อหัวข้อ) */
  topics: string[];
  /** ไฟล์ PDF อ้างอิง */
  files: string[];
  /** จำนวนข้อ */
  count: number;
  /** โน้ตเพิ่มเติมถึง AI */
  note: string;
}

/** ควิซที่ generate ออกมา (พร้อมให้แก้ไข) */
export interface Quiz {
  /** รหัสรุ่น — เปลี่ยนทุกครั้งที่ generate ใหม่ เพื่อ reset ฟอร์ม */
  revision: string;
  week: string;
  title: string;
  questions: QuizQuestion[];
}

/** CLO จำลองที่แกะมาจาก Course Syllabus */
export const MOCK_CLOS = [
  "CLO 1: สามารถอธิบายหลักการและแนวคิดพื้นฐานของการเขียนโปรแกรมได้",
  "CLO 2: สามารถวิเคราะห์ปัญหาและออกแบบอัลกอริทึมเบื้องต้นได้",
  "CLO 3: สามารถประยุกต์ใช้โครงสร้างควบคุม (Control Structures) ในการแก้ปัญหาได้",
  "CLO 4: สามารถเขียนและแก้ไขข้อผิดพลาด (Debugging) ของโปรแกรมได้",
];

/** ตัวเลือกหัวข้อ/ไฟล์สำหรับฟอร์มโจทย์ (อ้างจาก mock topics) */
export const QUIZ_SOURCE_TOPICS = MOCK_AI_TOPICS.map((t) => ({
  title: t.title,
  file: t.file,
}));

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/** ค่าเริ่มต้นของโจทย์ */
export function emptyPrompt(): QuizPrompt {
  return {
    clo: [],
    topics: [],
    files: [],
    count: 5,
    note: "",
  };
}

/** ตัวเลือกใหม่สำหรับปุ่ม "เพิ่มตัวเลือก" */
export function blankChoice(): QuizChoice {
  return { id: uid("c"), text: "" };
}

/** สร้างคำถามปรนัยเปล่า 1 ข้อ (4 ตัวเลือก) สำหรับปุ่ม "เพิ่มคำถาม" */
export function blankQuestion(): QuizQuestion {
  const choices = Array.from({ length: 4 }, () => blankChoice());
  return {
    id: uid("q"),
    type: "mcq",
    question: "",
    choices,
    answer: choices[0].id,
    points: 1,
  };
}

/* ---------- ตัวสร้างคำถามจำลอง (แทนการเรียก AI จริง) ---------- */

function mockMcq(topic: string): QuizQuestion {
  const choices: QuizChoice[] = [
    { id: uid("c"), text: `นิยามหลักของ "${topic}"` },
    { id: uid("c"), text: `แนวคิดที่ไม่เกี่ยวข้องกับ "${topic}"` },
    { id: uid("c"), text: `ตัวอย่างการใช้งานที่ผิดของ "${topic}"` },
    { id: uid("c"), text: `คำจำกัดความที่คลาดเคลื่อนของ "${topic}"` },
  ];
  return {
    id: uid("q"),
    type: "mcq",
    question: `ข้อใดอธิบายแนวคิดเรื่อง "${topic}" ได้ถูกต้องที่สุด`,
    choices,
    answer: choices[0].id,
    points: 1,
    topic,
  };
}

/**
 * จำลองการ generate ควิซจากโจทย์ที่อาจารย์กรอก
 * (ยังไม่ได้ต่อ AI จริง — สร้างคำถามปรนัยจากหัวข้อที่เลือกแบบวนรอบ)
 */
export function generateMockQuiz(week: string, prompt: QuizPrompt): Quiz {
  const topics = prompt.topics.length > 0 ? prompt.topics : ["หัวข้อการเรียน"];
  const count = Math.max(1, Math.min(prompt.count || 1, 30));

  const questions: QuizQuestion[] = Array.from({ length: count }, (_, i) =>
    mockMcq(topics[i % topics.length]),
  );

  return {
    revision: uid("rev"),
    week,
    title: `แบบทดสอบ ${week}`,
    questions,
  };
}
