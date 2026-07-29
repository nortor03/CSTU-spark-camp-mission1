import type { QuizChoice, QuizSource } from "./quiz";

/** คำตอบของนักเรียน: map questionId → choiceId ที่เลือก (null = ยังไม่ตอบ) */
export type StudentAnswers = Record<string, string | null>;

/**
 * ข้อมูลคำถามขั้นต่ำที่พอสำหรับแสดงผล/ให้ feedback หลังตรวจ — ไม่มี field เฉลย
 * เพราะฝั่งนักเรียนต้องไม่ได้รับเฉลยติดมากับตัวคำถามเลย (ดูจาก StudentQuiz ใน
 * lib/quizGradingApi.ts) เฉลยจะรู้ได้ก็ต่อเมื่อ backend ตรวจแล้วส่ง correctId
 * กลับมาเท่านั้น (ผ่าน GradedQuestionResult ด้านล่าง)
 */
export interface FeedbackQuestion {
  id: string;
  question: string;
  choices: QuizChoice[];
  /** ใช้ตอนสร้างแบบฝึกหัดเจาะจุดที่พลาด (lib/practiceQuizApi.ts) — ไม่ใช่ข้อมูลเฉลย */
  topic?: string;
}

/** ผลของคำถาม 1 ข้อ หลังตรวจ */
export interface QuestionResult {
  question: FeedbackQuestion;
  chosenId: string | null;
  correctId: string;
  isCorrect: boolean;
  /** feedback จาก AI (จำลอง) รายข้อ */
  feedback: string;
  /** คำอธิบายเฉลย — รู้ได้ก็ตอนตรวจแล้วเท่านั้น (backend คืน null ให้ submission เก่าก่อนมี field นี้) */
  explanation?: string | null;
  /** เอกสาร/สไลด์ที่ควรกลับไปอ่านเพิ่ม — รู้ได้ก็ตอนตรวจแล้วเท่านั้นเช่นกัน */
  sources?: QuizSource[] | null;
}

/** ผลรวมของการทำแบบทดสอบ */
export interface QuizResult {
  score: number;
  total: number;
  percent: number;
  questions: QuestionResult[];
  /** feedback ภาพรวมจาก AI (จำลอง) */
  overall: string;
}

/**
 * ผลตรวจ 1 ข้อที่ backend ส่งกลับมาหลังเช็คคำตอบจริง (ไม่ใช่จากการเทียบในเครื่อง)
 * explanation/sources: backend เพิ่ม field นี้แล้ว — ควิซที่บันทึกไว้ก่อนมี field นี้
 * จะได้ null ทั้งคู่กลับมา (ไม่ error) ปลอดภัยที่จะให้มาตรงนี้เพราะเป็นข้อมูล
 * "หลังตรวจแล้ว" เท่านั้น เหมือน correctId
 */
export interface GradedQuestionResult {
  questionId: string;
  chosenId: string | null;
  correctId: string;
  isCorrect: boolean;
  explanation?: string | null;
  sources?: QuizSource[] | null;
}

function choiceText(q: FeedbackQuestion, id: string | null): string {
  return q.choices.find((c) => c.id === id)?.text ?? "-";
}

/** feedback รายข้อ (จำลองผลจาก LLM) — รับ correctId มาจากภายนอก ไม่อ่านจากตัวคำถามเอง */
function questionFeedback(
  q: FeedbackQuestion,
  correctId: string,
  isCorrect: boolean,
): string {
  const correct = choiceText(q, correctId);
  if (isCorrect) {
    return `ถูกต้อง — เข้าใจแนวคิดนี้ได้ดี คำตอบที่ถูกคือ “${correct}”`;
  }
  return `ยังไม่ถูก คำตอบที่ถูกต้องคือ “${correct}” ลองทบทวนเนื้อหาส่วนนี้เพิ่มเติมอีกครั้ง`;
}

/** feedback ภาพรวมตามคะแนน (จำลองผลจาก LLM) */
function overallFeedback(percent: number, score: number, total: number): string {
  const head = `คุณทำได้ ${score} จาก ${total} ข้อ (${percent}%) — `;
  if (percent === 100) {
    return head + "ยอดเยี่ยมมาก เข้าใจเนื้อหาสัปดาห์นี้ครบถ้วน";
  }
  if (percent >= 80) {
    return head + "ทำได้ดีมาก มีบางจุดเล็กน้อยที่ควรทบทวนเพิ่ม";
  }
  if (percent >= 50) {
    return (
      head +
      "ผ่านเกณฑ์ แต่การกลับไปทบทวนจุดที่ผิดพลาดจะช่วยให้เข้าใจเนื้อหาได้แม่นยำยิ่งขึ้น"
    );
  }
  return (
    head +
    "แนะนำให้ทบทวนเนื้อหาของสัปดาห์นี้เพิ่มเติม เพื่อที่จะสามารถเข้าใจเนื้อหาในสัปดาห์นี้ได้มากขึ้น"
  );
}

/**
 * ประกอบผลลัพธ์แสดงผล (QuizResult) จากผลตรวจที่ backend ส่งกลับมาแล้ว
 * (GradedQuestionResult ต่อข้อ) — ไม่มีการเทียบคำตอบ/อ่านเฉลยในเครื่องเลย
 * ใช้ทั้งฝั่งควิซจริง (ตรวจที่ backend) และฝั่งฝึกซ้อม (ตรวจในเครื่องแต่ผ่าน
 * หน้าตาเดียวกันผ่าน gradeQuiz ด้านล่าง)
 */
export function buildGradedResult(
  questions: FeedbackQuestion[],
  graded: GradedQuestionResult[],
): QuizResult {
  const gradedMap = new Map(graded.map((g) => [g.questionId, g]));

  const results: QuestionResult[] = questions.map((q) => {
    const g = gradedMap.get(q.id);
    const correctId = g?.correctId ?? "";
    const chosenId = g?.chosenId ?? null;
    const isCorrect = g?.isCorrect ?? false;
    return {
      question: q,
      chosenId,
      correctId,
      isCorrect,
      feedback: questionFeedback(q, correctId, isCorrect),
      explanation: g?.explanation,
      sources: g?.sources,
    };
  });

  const total = questions.length;
  const score = results.filter((r) => r.isCorrect).length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return {
    score,
    total,
    percent,
    questions: results,
    overall: overallFeedback(percent, score, total),
  };
}

/**
 * ตรวจคำตอบในเครื่อง — ใช้เฉพาะ "โหมดฝึกซ้อม" เท่านั้น (ควิซจำลองที่สร้างขึ้นใหม่
 * ทุกรอบในเครื่อง ไม่ใช่แบบทดสอบจริงของอาจารย์ จึงไม่มีเฉลยจริงให้รั่วไหล)
 * แบบทดสอบจริง (official) ต้องส่งไปตรวจที่ backend ผ่าน submitQuizAnswers
 * ใน lib/quizGradingApi.ts แทน — ดู StudentQuiz.tsx
 */
export function gradeQuiz(
  quiz: {
    questions: (FeedbackQuestion & {
      answer: string;
      explanation?: string;
      sources?: QuizSource[];
    })[];
  },
  answers: StudentAnswers,
): QuizResult {
  const graded: GradedQuestionResult[] = quiz.questions.map((q) => {
    const chosenId = answers[q.id] ?? null;
    return {
      questionId: q.id,
      chosenId,
      correctId: q.answer,
      isCorrect: chosenId === q.answer,
      explanation: q.explanation,
      sources: q.sources,
    };
  });
  return buildGradedResult(quiz.questions, graded);
}
