import type { Quiz, QuizQuestion } from "./quiz";
import type { StudentAnswers } from "./feedback";

/* ==========================================================================
   ชั้นวิเคราะห์ผลการเรียนรู้
   - ฝั่งนักเรียน: สรุปจุดแข็ง / จุดอ่อน รายหัวข้อ
   - ฝั่งอาจารย์: สรุปภาพรวมทั้งชั้นเรียน + ข้อที่ควรทบทวน
   หมายเหตุ: ตอนนี้คำนวณจากผลควิซจริงในเครื่อง (ยังไม่เรียก LLM จริง)
   ========================================================================== */

/** คำตอบที่นักเรียน 1 คนส่งใน 1 สัปดาห์ */
export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  week: string;
  /** รุ่นของควิซที่ทำ — กันกรณีอาจารย์ generate ชุดใหม่ */
  quizRevision: string;
  answers: StudentAnswers;
  score: number;
  total: number;
  percent: number;
  /** ISO timestamp */
  submittedAt: string;
  /** true = แถวนี้คือของผู้ใช้ที่กำลังล็อกอินอยู่ (ไม่ใช่เพื่อนร่วมชั้นจำลอง) */
  isCurrentUser?: boolean;
}

/** ระดับความเข้าใจของหัวข้อหนึ่ง */
export type MasteryLevel = "strong" | "medium" | "weak";

/** ผลรายหัวข้อ */
export interface TopicMastery {
  topic: string;
  correct: number;
  total: number;
  percent: number;
  level: MasteryLevel;
}

export const UNKNOWN_TOPIC = "ไม่ระบุหัวข้อ";

/** เกณฑ์แบ่งระดับ — แยกเป็นค่าคงที่เพื่อให้ปรับที่เดียว */
export const STRONG_AT = 80;
export const WEAK_BELOW = 50;

export function levelOf(percent: number): MasteryLevel {
  if (percent >= STRONG_AT) return "strong";
  if (percent < WEAK_BELOW) return "weak";
  return "medium";
}

/** ป้ายกำกับ + สีของแต่ละระดับ (สองขั้ว เขียว↔แดง มีเทาเป็นกลาง) */
export const LEVEL_META: Record<
  MasteryLevel,
  { label: string; hex: string; icon: string }
> = {
  strong: { label: "เข้าใจดี", hex: "#047857", icon: "▲" },
  medium: { label: "พอใช้", hex: "#8A7B70", icon: "■" },
  weak: { label: "ควรทบทวน", hex: "#C8102E", icon: "▼" },
};

function topicOf(q: QuizQuestion): string {
  return q.topic?.trim() || UNKNOWN_TOPIC;
}

function pct(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

/* ---------- ฝั่งนักเรียน ---------- */

/** แยกผลรายหัวข้อของนักเรียน 1 คน */
export function topicMastery(
  quiz: Quiz,
  answers: StudentAnswers,
): TopicMastery[] {
  const map = new Map<string, { correct: number; total: number }>();

  for (const q of quiz.questions) {
    const key = topicOf(q);
    const cur = map.get(key) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (answers[q.id] === q.answer) cur.correct += 1;
    map.set(key, cur);
  }

  return Array.from(map.entries())
    .map(([topic, { correct, total }]) => {
      const percent = pct(correct, total);
      return { topic, correct, total, percent, level: levelOf(percent) };
    })
    .sort((a, b) => b.percent - a.percent);
}

/** สิ่งที่นักเรียนเข้าใจคลาดเคลื่อน (ดูจากตัวเลือกที่เลือกผิด) */
export interface Misconception {
  topic: string;
  question: string;
  chosenText: string;
  correctText: string;
}

/** สรุปผลการเรียนรู้ของนักเรียน 1 คน */
export interface StudentSummary {
  percent: number;
  score: number;
  total: number;
  topics: TopicMastery[];
  strong: TopicMastery[];
  weak: TopicMastery[];
  misconceptions: Misconception[];
  /** ข้อเสนอแนะขั้นถัดไป (จำลองผลจาก LLM) */
  nextSteps: string[];
  /** สรุปภาพรวมเป็นประโยค */
  headline: string;
}

function choiceText(q: QuizQuestion, id: string | null | undefined): string {
  return q.choices.find((c) => c.id === id)?.text ?? "(ไม่ได้ตอบ)";
}

export function buildStudentSummary(
  quiz: Quiz,
  answers: StudentAnswers,
): StudentSummary {
  const topics = topicMastery(quiz, answers);
  const total = quiz.questions.length;
  const score = quiz.questions.filter((q) => answers[q.id] === q.answer).length;
  const percent = pct(score, total);

  const strong = topics.filter((t) => t.level === "strong");
  const weak = topics.filter((t) => t.level === "weak");

  const misconceptions: Misconception[] = quiz.questions
    .filter((q) => answers[q.id] !== q.answer)
    .map((q) => ({
      topic: topicOf(q),
      question: q.question,
      chosenText: choiceText(q, answers[q.id]),
      correctText: choiceText(q, q.answer),
    }));

  const nextSteps: string[] = [];
  if (weak.length > 0) {
    nextSteps.push(
      `ทบทวนหัวข้อ ${weak.map((t) => `“${t.topic}”`).join(" และ ")} จากเอกสารการสอนอีกครั้ง แล้วลองทำแบบทดสอบซ้ำ`,
    );
  }
  const medium = topics.filter((t) => t.level === "medium");
  if (medium.length > 0) {
    nextSteps.push(
      `หัวข้อ ${medium.map((t) => `“${t.topic}”`).join(" และ ")} เข้าใจระดับหนึ่งแล้ว แต่ยังตอบผิดบางข้อ ลองอธิบายแนวคิดนี้ด้วยคำพูดตัวเองดู`,
    );
  }
  if (strong.length > 0) {
    nextSteps.push(
      `ทำได้ดีในหัวข้อ ${strong.map((t) => `“${t.topic}”`).join(" และ ")} — ใช้ความเข้าใจนี้ต่อยอดกับหัวข้อที่ยังไม่แม่นได้`,
    );
  }
  if (nextSteps.length === 0) {
    nextSteps.push("ทำได้ครบทุกข้อ ลองอ่านเนื้อหาสัปดาห์ถัดไปล่วงหน้าได้เลย");
  }

  let headline: string;
  if (percent === 100) {
    headline = "เข้าใจเนื้อหาสัปดาห์นี้ครบถ้วนทุกหัวข้อ";
  } else if (weak.length === 0) {
    headline = "ภาพรวมเข้าใจดี มีบางข้อที่พลาดเล็กน้อย";
  } else if (strong.length === 0) {
    headline = "ยังมีหลายหัวข้อที่ควรกลับไปทบทวนก่อนเรียนสัปดาห์ถัดไป";
  } else {
    headline = `เข้าใจดีใน ${strong.length} หัวข้อ แต่ยังต้องทบทวนอีก ${weak.length} หัวข้อ`;
  }

  return {
    percent,
    score,
    total,
    topics,
    strong,
    weak,
    misconceptions,
    nextSteps,
    headline,
  };
}

/* ---------- ฝั่งอาจารย์: สังเคราะห์ข้อสังเกตจาก Student Summary ---------- */

/**
 * หลักฐาน 1 ชิ้นของข้อสังเกตระดับชั้นเรียน — ระบุว่ามาจากนักศึกษาคนไหน
 * และประโยค/ข้อความดั้งเดิมที่เป็นจุดตั้งต้น (ตัดตรงจาก StudentSummary ของคนนั้น)
 */
export interface InsightEvidence {
  studentId: string;
  studentName: string;
  /** ข้อความดั้งเดิมที่เป็นที่มาของข้อสังเกต เช่น ตัวเลือกที่เลือกผิด vs คำตอบที่ถูก */
  detail: string;
}

/** ข้อสังเกตระดับชั้นเรียน 1 ข้อ — สังเคราะห์จาก StudentSummary ของนักศึกษาหลายคนที่มีลักษณะคล้ายกัน */
export interface ClassInsight {
  id: string;
  type?: string;
  topic: string;
  /** สรุปสั้น ๆ ระดับชั้นเรียน (สิ่งที่ AI "สังเกตเห็น") */
  headline: string;
  /** รายละเอียดเสริม เช่น ความเข้าใจคลาดเคลื่อนที่พบบ่อยที่สุดในหัวข้อนี้ */
  description: string;
  /** จำนวนนักศึกษาที่เป็นที่มาของข้อสังเกตนี้ */
  studentCount: number;
  /** หลักฐานรายคน — กดดูได้ว่าอ้างอิงจากใครบ้าง */
  evidence: InsightEvidence[];
}

/**
 * จำลองการทำงานของ AI (deterministic — ยังไม่ได้ต่อ LLM จริง):
 * อ่าน misconceptions และ weak topics จาก buildStudentSummary() ของนักศึกษาทุกคน
 * แล้วจัดกลุ่มตามหัวข้อที่มีลักษณะคล้ายกัน ให้กลายเป็น "ข้อสังเกตระดับชั้นเรียน"
 * พร้อมแนบรายชื่อ + ข้อความดั้งเดิมของนักศึกษาที่เกี่ยวข้องไว้เป็น evidence
 */
export function synthesizeStudentSummaries(
  quiz: Quiz,
  submissions: Submission[],
): ClassInsight[] {
  interface Bucket {
    topic: string;
    students: Map<string, InsightEvidence>;
    wrongTextTally: Map<string, number>;
  }
  const buckets = new Map<string, Bucket>();

  for (const sub of submissions) {
    const summary = buildStudentSummary(quiz, sub.answers);

    // จุดตั้งต้นหลัก: ข้อที่นักศึกษาตอบผิด (misconception) — มีข้อความดั้งเดิมชัดเจนที่สุด
    for (const m of summary.misconceptions) {
      const bucket =
        buckets.get(m.topic) ??
        ({ topic: m.topic, students: new Map(), wrongTextTally: new Map() } as Bucket);

      // 1 คนต่อ 1 evidence ต่อหัวข้อ (ใช้ misconception แรกของหัวข้อนั้นเป็นตัวแทน)
      if (!bucket.students.has(sub.studentId)) {
        bucket.students.set(sub.studentId, {
          studentId: sub.studentId,
          studentName: sub.studentName,
          detail: `ข้อ “${m.question}” — เลือก “${m.chosenText}” แทนที่จะเป็น “${m.correctText}”`,
        });
      }
      bucket.wrongTextTally.set(
        m.chosenText,
        (bucket.wrongTextTally.get(m.chosenText) ?? 0) + 1,
      );
      buckets.set(m.topic, bucket);
    }
  }

  const insights: ClassInsight[] = Array.from(buckets.values())
    .map((b) => {
      const evidence = Array.from(b.students.values());
      const topWrong = Array.from(b.wrongTextTally.entries()).sort(
        (a, b2) => b2[1] - a[1],
      )[0];

      const headline = `นักศึกษา ${evidence.length} คนมีความเข้าใจคลาดเคลื่อนในหัวข้อ “${b.topic}”`;
      const description = topWrong
        ? `ส่วนใหญ่เข้าใจผิดไปทาง “${topWrong[0]}” (${topWrong[1]} คน) — น่าจะเป็นความเข้าใจคลาดเคลื่อนร่วมของห้อง ควรอธิบายจุดนี้ซ้ำในคาบถัดไป`
        : `พบความเข้าใจคลาดเคลื่อนหลายรูปแบบในหัวข้อนี้ ลองดูหลักฐานรายคนประกอบ`;

      return {
        id: `insight-${b.topic}`,
        topic: b.topic,
        headline,
        description,
        studentCount: evidence.length,
        evidence,
      };
    })
    // เรียงตามจำนวนนักศึกษาที่ได้รับผลกระทบ — ข้อสังเกตที่ร่วมกันมากสุดขึ้นก่อน
    .sort((a, b) => b.studentCount - a.studentCount)
    .slice(0, 6);

  return insights;
}

/* ---------- ฝั่งอาจารย์ (ภาพรวมทั้งชั้น) ---------- */

/** ข้อที่นักเรียนตอบผิดเยอะ พร้อมตัวเลือกที่ผิดยอดนิยม */
export interface HardQuestion {
  question: QuizQuestion;
  topic: string;
  correctRate: number;
  /** ตัวเลือกผิดที่ถูกเลือกมากที่สุด — สัญญาณของ misconception ร่วมของห้อง */
  topWrongText: string;
  topWrongCount: number;
}

/** ช่วงคะแนนสำหรับกราฟการกระจาย */
export interface ScoreBucket {
  label: string;
  count: number;
}

export interface ClassReport {
  week: string;
  studentCount: number;
  /** ค่าเฉลี่ยเป็นเปอร์เซ็นต์ */
  average: number;
  median: number;
  /** สัดส่วนที่ได้ตั้งแต่ 50% ขึ้นไป */
  passRate: number;
  distribution: ScoreBucket[];
  topics: TopicMastery[];
  hardest: HardQuestion[];
  /** หัวข้อที่ควรทบทวนในคาบถัดไป */
  reviewPlan: string[];
  /** ข้อสังเกตที่สังเคราะห์จากสรุปของนักเรียนแต่ละคน (แทนการสร้างจากควิซตรงๆ) */
  insights: ClassInsight[];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? Math.round((s[mid - 1] + s[mid]) / 2) : s[mid];
}

export function buildClassReport(
  quiz: Quiz,
  submissions: Submission[],
): ClassReport {
  const studentCount = submissions.length;
  const percents = submissions.map((s) => s.percent);

  const average =
    studentCount > 0
      ? Math.round(percents.reduce((a, b) => a + b, 0) / studentCount)
      : 0;

  const passRate =
    studentCount > 0
      ? Math.round(
          (percents.filter((p) => p >= WEAK_BELOW).length / studentCount) * 100,
        )
      : 0;

  const buckets: { label: string; min: number; max: number }[] = [
    { label: "0–49%", min: 0, max: 49 },
    { label: "50–69%", min: 50, max: 69 },
    { label: "70–84%", min: 70, max: 84 },
    { label: "85–100%", min: 85, max: 100 },
  ];
  const distribution: ScoreBucket[] = buckets.map((b) => ({
    label: b.label,
    count: percents.filter((p) => p >= b.min && p <= b.max).length,
  }));

  // รวมผลรายหัวข้อของทุกคน
  const topicAgg = new Map<string, { correct: number; total: number }>();
  for (const q of quiz.questions) {
    const key = topicOf(q);
    const cur = topicAgg.get(key) ?? { correct: 0, total: 0 };
    for (const sub of submissions) {
      cur.total += 1;
      if (sub.answers[q.id] === q.answer) cur.correct += 1;
    }
    topicAgg.set(key, cur);
  }
  const topics: TopicMastery[] = Array.from(topicAgg.entries())
    .map(([topic, { correct, total }]) => {
      const percent = pct(correct, total);
      return { topic, correct, total, percent, level: levelOf(percent) };
    })
    .sort((a, b) => a.percent - b.percent);

  // ข้อที่ตอบถูกน้อยที่สุด + ตัวเลือกผิดยอดนิยม
  const hardest: HardQuestion[] = quiz.questions
    .map((q) => {
      const correct = submissions.filter(
        (s) => s.answers[q.id] === q.answer,
      ).length;

      const wrongTally = new Map<string, number>();
      for (const s of submissions) {
        const chosen = s.answers[q.id];
        if (chosen && chosen !== q.answer) {
          wrongTally.set(chosen, (wrongTally.get(chosen) ?? 0) + 1);
        }
      }
      const top = Array.from(wrongTally.entries()).sort(
        (a, b) => b[1] - a[1],
      )[0];

      return {
        question: q,
        topic: topicOf(q),
        correctRate: pct(correct, studentCount),
        topWrongText: top ? choiceText(q, top[0]) : "—",
        topWrongCount: top ? top[1] : 0,
      };
    })
    .sort((a, b) => a.correctRate - b.correctRate)
    .slice(0, 5);

  const weakTopics = topics.filter((t) => t.level !== "strong");
  const reviewPlan: string[] = [];
  if (weakTopics.length > 0) {
    reviewPlan.push(
      `ทบทวนหัวข้อ ${weakTopics
        .slice(0, 2)
        .map((t) => `“${t.topic}”`)
        .join(" และ ")} ในช่วงต้นคาบถัดไป — ทั้งห้องตอบถูกต่ำกว่าเกณฑ์`,
    );
  }
  const worst = hardest[0];
  if (worst && worst.topWrongCount > 0) {
    reviewPlan.push(
      `นักเรียน ${worst.topWrongCount} คนตอบข้อที่ยากที่สุดผิดแบบเดียวกัน (หัวข้อ “${worst.topic}”) — น่าจะเป็นความเข้าใจคลาดเคลื่อนร่วมกัน ควรอธิบายจุดนี้ซ้ำ`,
    );
  }
  if (reviewPlan.length === 0) {
    reviewPlan.push(
      "ภาพรวมทั้งห้องเข้าใจดีทุกหัวข้อ สามารถเดินหน้าเนื้อหาสัปดาห์ถัดไปได้",
    );
  }

  const insights = synthesizeStudentSummaries(quiz, submissions);

  return {
    week: quiz.week,
    studentCount,
    average,
    median: median(percents),
    passRate,
    distribution,
    topics,
    hardest,
    reviewPlan,
    insights,
  };
}