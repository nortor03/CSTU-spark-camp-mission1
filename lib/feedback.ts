import type { Quiz, QuizQuestion } from "./quiz";

/** คำตอบของนักเรียน: map questionId → choiceId ที่เลือก (null = ยังไม่ตอบ) */
export type StudentAnswers = Record<string, string | null>;

/** ผลของคำถาม 1 ข้อ หลังตรวจ */
export interface QuestionResult {
  question: QuizQuestion;
  chosenId: string | null;
  correctId: string;
  isCorrect: boolean;
  /** feedback จาก AI (จำลอง) รายข้อ */
  feedback: string;
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

function choiceText(q: QuizQuestion, id: string | null): string {
  return q.choices.find((c) => c.id === id)?.text ?? "-";
}

/** feedback รายข้อ (จำลองผลจาก LLM) */
function questionFeedback(q: QuizQuestion, isCorrect: boolean): string {
  const correct = choiceText(q, q.answer);
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
    return head + "ผ่านเกณฑ์ แต่ยังมีหลายข้อที่ควรกลับไปทบทวนให้แม่นขึ้น";
  }
  return head + "ควรกลับไปทบทวนเนื้อหาสัปดาห์นี้อีกครั้งก่อนสอบจริง";
}

/**
 * ตรวจคำตอบและสร้าง feedback (จำลองการเรียก AI/LLM)
 * เทียบ choiceId ที่เลือกกับเฉลย (question.answer)
 */
export function gradeQuiz(quiz: Quiz, answers: StudentAnswers): QuizResult {
  const questions: QuestionResult[] = quiz.questions.map((q) => {
    const chosenId = answers[q.id] ?? null;
    const isCorrect = chosenId === q.answer;
    return {
      question: q,
      chosenId,
      correctId: q.answer,
      isCorrect,
      feedback: questionFeedback(q, isCorrect),
    };
  });

  const total = quiz.questions.length;
  const score = questions.filter((r) => r.isCorrect).length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return {
    score,
    total,
    percent,
    questions,
    overall: overallFeedback(percent, score, total),
  };
}
