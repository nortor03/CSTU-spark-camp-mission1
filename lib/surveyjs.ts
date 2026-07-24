import type { Quiz } from "./quiz";
import type { StudentAnswers } from "./feedback";

/* ==========================================================================
   สะพานเชื่อม Quiz (โครงข้อมูลของเรา) ↔ SurveyJS (Form Library)

   แนวคิด: ให้ "ชื่อคำถาม" ใน SurveyJS = id ของคำถามเรา และ
   "ค่าตัวเลือก" = id ของตัวเลือกเรา → อ่านคำตอบกลับมาเป็น StudentAnswers
   ได้ตรง ๆ โดยไม่ต้อง map เพิ่ม แล้วส่งเข้า gradeQuiz เดิมได้เลย
   ========================================================================== */

/** โครง JSON ของ SurveyJS ที่เรา generate (พอสำหรับ type ภายใน) */
export interface SurveyJSModel {
  title?: string;
  showQuestionNumbers: "on" | "off";
  completeText: string;
  elements: {
    type: "radiogroup";
    name: string;
    title: string;
    isRequired: boolean;
    choices: { value: string; text: string }[];
  }[];
}

/**
 * ชื่อ element ใน SurveyJS ต้อง "ไม่ซ้ำ" มิฉะนั้น SurveyJS จะถือว่าเป็น
 * คำถามเดียวกัน แล้วใช้ค่าคำตอบร่วม key เดียวกัน (เลือกข้อหลังทับข้อก่อน)
 * จึงผูกชื่อกับ "ตำแหน่ง" (index) เพื่อกันปัญหา แม้ q.id จะซ้ำ/ว่าง
 * (เช่น ควิซเก่าใน localStorage) — แล้ว map กลับด้วย index ตัวเดียวกัน
 */
function questionName(index: number): string {
  return `q_${index}`;
}

/** แปลงควิซของเรา → SurveyJS model JSON (ทุกข้ออยู่หน้าเดียว เหมือน Google Form) */
export function quizToSurveyJSON(quiz: Quiz): SurveyJSModel {
  return {
    // ไม่ใส่ title ระดับแบบทดสอบ — หน้าเพจแสดงชื่อให้แล้ว (กันชื่อซ้ำ)
    showQuestionNumbers: "on",
    completeText: "ส่งคำตอบ",
    elements: quiz.questions.map((q, i) => ({
      type: "radiogroup",
      name: questionName(i), // ผูกกับตำแหน่ง → การันตีไม่ซ้ำ
      title: q.question,
      isRequired: true, // บังคับตอบครบก่อนส่ง (แทน logic ปุ่ม disabled เดิม)
      choices: q.choices.map((c) => ({ value: c.id, text: c.text })),
    })),
  };
}

/**
 * อ่าน data ที่ SurveyJS ส่งกลับ ({ [questionId]: choiceId }) → StudentAnswers
 * เดินตามคำถามในควิซเพื่อการันตีว่ามีครบทุกข้อ (ข้อที่ไม่ตอบ = null)
 */
export function surveyDataToAnswers(
  quiz: Quiz,
  data: Record<string, unknown>,
): StudentAnswers {
  const answers: StudentAnswers = {};
  quiz.questions.forEach((q, i) => {
    const v = data[questionName(i)];
    answers[q.id] = typeof v === "string" ? v : null;
  });
  return answers;
}
