import { MOCK_AI_TOPICS } from "./mockTopics";

/** ตัวเลือกของคำถามปรนัย */
export interface QuizChoice {
  id: string;
  text: string;
}

/** เอกสารอ้างอิงที่ AI ใช้อ้างอิงตอนสร้างคำถามข้อนี้ */
export interface QuizSource {
  documentId: string;
  filename: string;
  /** ตำแหน่งในเอกสาร เช่น "page 12" */
  sourceLocation: string;
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
  /** คำอธิบายว่าทำไมตัวเลือกที่ถูกถึงถูก — มาจาก AI ตอน generate (ไม่มีในคำถามที่อาจารย์เพิ่มเอง) */
  explanation?: string;
  /** รหัส CLO ที่คำถามข้อนี้เกี่ยวข้อง (อาจมีมากกว่า 1 ข้อ) */
  relatedClos?: string[];
  /** แท็กหัวข้อย่อยของคำถามข้อนี้ */
  topicTags?: string[];
  /** ที่มาของคำถาม เช่น "course_material" | "general_knowledge" */
  grounding?: string;
  /** เอกสารอ้างอิงที่ AI ใช้สร้างคำถามข้อนี้ */
  sources?: QuizSource[];
}

/**
 * โจทย์ที่อาจารย์กรอกเพื่อสั่ง generate — ตรงกับ payload.prompt ที่ส่งให้ backend ทุกฟิลด์
 * ข้อจำกัดจริงของ AI service: clo/topics ต้องมีอย่างน้อย 1 รายการ, count ห้ามเกิน 20
 */
export interface QuizPrompt {
  /** ผลลัพธ์การเรียนรู้ (CLO) ที่เกี่ยวข้องกับสัปดาห์นี้ — ต้องมีอย่างน้อย 1 รายการ */
  clo: string[];
  /** หัวข้อที่จะทดสอบของสัปดาห์นี้ — ต้องมีอย่างน้อย 1 รายการ */
  topics: string[];
  /** จำนวนข้อ (5-20) */
  count: number;
  /** โน้ตเพิ่มเติมถึง AI */
  note: string;
}

/** ควิซที่ generate ออกมา (พร้อมให้แก้ไข) */
export interface Quiz {
  id: string;
  isActive: boolean;
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

