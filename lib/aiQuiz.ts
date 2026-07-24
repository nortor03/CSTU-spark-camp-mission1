import type { Quiz, QuizChoice, QuizQuestion } from "./quiz";
import type { QuizPrompt } from "./quiz";
import { generateMockQuiz } from "./quiz";

/* ==========================================================================
   จุดเชื่อม AI สำหรับ "สร้างควิซจากโจทย์" (AI seam)

   ตอนนี้ยังไม่มี AI จริงให้ต่อ → ข้างในเป็น MOCK (สุ่มสร้างคำถามจำลอง)
   โครงถูกออกแบบให้ "สลับเป็น AI จริงได้โดยแก้ที่เดียว" — ส่วน UI ทั้งหมด
   (หน้ากรอกโจทย์ / หน้าแก้ไข / แชทบอท) เรียกผ่านฟังก์ชันนี้เท่านั้น

   ▶ วิธีต่อ AI จริงในอนาคต (เช่น Claude):
     1. สร้าง route ฝั่ง server: app/api/quiz-generate/route.ts
        (เก็บ ANTHROPIC_API_KEY ไว้ฝั่ง server เท่านั้น — ห้าม NEXT_PUBLIC_)
     2. เปลี่ยน body ของ generateQuizJSON เป็น:
          const res = await fetch("/api/quiz-generate", {
            method: "POST",
            body: JSON.stringify({ week, prompt }),
          });
          const aiJson = await res.json();
          return aiJsonToQuiz(aiJson, week);   // ← แปลง JSON จาก AI ให้เป็น Quiz
     3. UI ไม่ต้องแก้ — QuizEditor + QuizChat รับ Quiz ที่ได้ไปแสดงให้แก้ต่อ
   ========================================================================== */

/** สร้างควิซจากโจทย์ที่อาจารย์กรอก (async เผื่อการเรียก AI จริงในอนาคต) */
export async function generateQuizJSON(
  week: string,
  prompt: QuizPrompt,
): Promise<Quiz> {
  // จำลองความหน่วงของการเรียก AI ให้ UX เหมือนกำลัง "คิดข้อสอบ"
  await new Promise((resolve) => setTimeout(resolve, 900));

  // TODO(AI): แทนบรรทัดล่างด้วยการเรียก AI จริง แล้วส่งผลผ่าน aiJsonToQuiz()
  return generateMockQuiz(week, prompt);
}

/* --------------------------------------------------------------------------
   aiJsonToQuiz — แปลง "JSON ที่ AI ส่งกลับ" → type Quiz ภายในของเรา

   ทำหน้าที่: validate โครงสร้าง + gen id ที่ไม่ซ้ำ + หา "เฉลย" ให้ครบ
   เพื่อให้ Quiz ที่ได้ป้อนเข้า QuizEditor / grading ได้ทันทีอย่างปลอดภัย

   สคีมาที่คาดหวังจาก AI (ปรับ prompt ฝั่ง AI ให้ส่งตามนี้):
     {
       "title": "แบบทดสอบ สัปดาห์ที่ 1",           // ไม่บังคับ
       "questions": [
         {
           "question": "ข้อความคำถาม",
           "choices": ["ตัวเลือก A", "ตัวเลือก B", "ตัวเลือก C", "ตัวเลือก D"],
           "answerIndex": 0,                          // index (0-based) ของคำตอบที่ถูก
           "points": 1,                               // ไม่บังคับ (ค่าเริ่มต้น 1)
           "topic": "หัวข้อ"                          // ไม่บังคับ
         }
       ]
     }

   รองรับรูปแบบเฉลยอื่นด้วย (เรียงตามความน่าเชื่อถือ):
     1) answerIndex (number)
     2) choices เป็น object ที่มี { text, correct: true }
     3) answer เป็น "ข้อความ" ที่ตรงกับตัวเลือกใดตัวเลือกหนึ่ง
   ถ้าหาเฉลยไม่ได้เลย → default เป็นตัวเลือกแรก (อาจารย์แก้เฉลยในหน้าแก้ไขได้)
   -------------------------------------------------------------------------- */

/** ตัวเลือกจาก AI — เป็น string ตรง ๆ หรือ object ที่ระบุเฉลยได้ */
export type AiQuizChoice = string | { text: string; correct?: boolean };

/** คำถาม 1 ข้อจาก AI */
export interface AiQuizQuestion {
  question: string;
  choices: AiQuizChoice[];
  /** index (0-based) ของตัวเลือกที่เป็นคำตอบที่ถูก */
  answerIndex?: number;
  /** ข้อความของคำตอบที่ถูก (ใช้เมื่อไม่มี answerIndex) */
  answer?: string;
  points?: number;
  topic?: string;
}

/** โครง JSON ระดับบนสุดที่ AI ส่งกลับ */
export interface AiQuizJSON {
  title?: string;
  questions: AiQuizQuestion[];
}

// gen id ที่การันตีไม่ซ้ำ (กัน bug id ซ้ำที่ทำให้ radio เลือกได้ชุดเดียว)
let idSeq = 0;
function genId(prefix: string): string {
  idSeq += 1;
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${idSeq}-${rand}`;
}

/** ข้อความของตัวเลือก ไม่ว่าจะเป็น string หรือ object */
function choiceText(c: AiQuizChoice): string {
  return typeof c === "string" ? c : String(c?.text ?? "");
}

/**
 * แปลง JSON จาก AI → Quiz ที่พร้อมใช้ (validate + gen id + เติมเฉลย)
 * @throws Error ถ้าโครงสร้างผิดรูป (ให้ผู้เรียก catch แล้วแจ้ง error โดยไม่ crash)
 */
export function aiJsonToQuiz(raw: unknown, week: string): Quiz {
  const data = raw as AiQuizJSON | null;
  if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error(
      'รูปแบบ JSON จาก AI ไม่ถูกต้อง: ต้องมี "questions" เป็น array อย่างน้อย 1 ข้อ',
    );
  }

  const questions: QuizQuestion[] = data.questions.map((q, qi) => {
    if (!q || typeof q.question !== "string" || !q.question.trim()) {
      throw new Error(`ข้อ ${qi + 1}: ไม่มีข้อความคำถาม`);
    }
    const rawChoices = Array.isArray(q.choices) ? q.choices : [];
    if (rawChoices.length < 2) {
      throw new Error(`ข้อ ${qi + 1}: ต้องมีตัวเลือกอย่างน้อย 2 ตัว`);
    }

    // normalize ตัวเลือก → { id (ไม่ซ้ำ), text }
    const choices: QuizChoice[] = rawChoices.map((c) => ({
      id: genId("c"),
      text: choiceText(c).trim(),
    }));

    // หา index ของคำตอบที่ถูก ตามลำดับความน่าเชื่อถือ
    let correctIdx = -1;
    if (
      typeof q.answerIndex === "number" &&
      q.answerIndex >= 0 &&
      q.answerIndex < choices.length
    ) {
      correctIdx = q.answerIndex;
    } else {
      const flagged = rawChoices.findIndex(
        (c) => typeof c === "object" && c?.correct === true,
      );
      if (flagged >= 0) {
        correctIdx = flagged;
      } else if (typeof q.answer === "string" && q.answer.trim()) {
        correctIdx = choices.findIndex(
          (c) => c.text === q.answer!.trim(),
        );
      }
    }
    // หาเฉลยไม่ได้ → ใช้ตัวเลือกแรก (อาจารย์แก้เฉลยในหน้าแก้ไขได้)
    if (correctIdx < 0) correctIdx = 0;

    return {
      id: genId("q"),
      type: "mcq",
      question: q.question.trim(),
      choices,
      answer: choices[correctIdx].id,
      points:
        typeof q.points === "number" && q.points > 0 ? q.points : 1,
      ...(typeof q.topic === "string" && q.topic.trim()
        ? { topic: q.topic.trim() }
        : {}),
    };
  });

  return {
    id: genId("quiz"),
    isActive: false,
    revision: genId("rev"),
    week,
    title:
      typeof data.title === "string" && data.title.trim()
        ? data.title.trim()
        : `แบบทดสอบ ${week}`,
    questions,
  };
}
