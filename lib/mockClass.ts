import type { Quiz } from "./quiz";
import type { StudentAnswers } from "./feedback";
import type { Submission } from "./analytics";

/* ==========================================================================
   เพื่อนร่วมชั้นจำลอง — ใช้ให้หน้ารายงานของอาจารย์มีข้อมูลพอจะเห็นภาพรวม
   (prototype: ยังไม่มีระบบ auth/หลายผู้ใช้จริง)

   จงใจสร้างแบบ deterministic จาก quiz.revision → เปิดหน้าซ้ำกี่ครั้งก็ได้
   ตัวเลขเดิม ทำให้ demo ต่อหน้ากรรมการได้โดยผลไม่เปลี่ยนกลางคัน
   ========================================================================== */

interface MockStudent {
  id: string;
  name: string;
}

/**
 * รายชื่อเพื่อนร่วมชั้นจำลอง — ย้ายออกไปเก็บใน .env.local
 * (ตัวแปร NEXT_PUBLIC_MOCK_STUDENTS เป็น JSON array)
 * ถ้าไม่ได้ตั้งค่าไว้ = ไม่มีเพื่อนร่วมชั้นจำลอง (รายงานจะเห็นเฉพาะผู้ที่ทำจริง)
 */
function loadMockStudents(): MockStudent[] {
  const raw = process.env.NEXT_PUBLIC_MOCK_STUDENTS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (s) => s && typeof s.id === "string" && typeof s.name === "string",
      );
    }
  } catch {
    // รูปแบบ JSON ผิด — ข้ามไป ใช้ค่าว่าง
  }
  return [];
}

const MOCK_STUDENTS: MockStudent[] = loadMockStudents();

/** PRNG แบบ deterministic (mulberry32) — seed เดียวกันได้ลำดับเดิมเสมอ */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** แปลง string → เลข seed */
function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * สร้างคำตอบของเพื่อนร่วมชั้นจำลอง
 *
 * แนวคิด: ความน่าจะเป็นที่จะตอบถูก = ความสามารถของนักเรียน × ความง่ายของหัวข้อ
 * และเมื่อตอบผิด ส่วนใหญ่จะเลือก "ตัวลวงยอดนิยม" ตัวเดียวกัน
 * เพื่อให้เห็น misconception ร่วมของห้องในหน้ารายงาน
 */
export function generateMockSubmissions(quiz: Quiz): Submission[] {
  const rng = makeRng(hashSeed(quiz.revision || quiz.week));

  // ความง่ายประจำหัวข้อ (0.35–0.95) — บางหัวข้อทั้งห้องจะพลาดเยอะ
  const topics = Array.from(
    new Set(quiz.questions.map((q) => q.topic ?? "ไม่ระบุหัวข้อ")),
  );
  const topicEase = new Map<string, number>();
  topics.forEach((t) => topicEase.set(t, 0.35 + rng() * 0.6));

  return MOCK_STUDENTS.map((student, i) => {
    // ความสามารถรายคน (0.45–0.95)
    const ability = 0.45 + rng() * 0.5;
    const answers: StudentAnswers = {};
    let score = 0;

    for (const q of quiz.questions) {
      const ease = topicEase.get(q.topic ?? "ไม่ระบุหัวข้อ") ?? 0.7;
      const pCorrect = Math.min(0.97, ability * ease + 0.1);

      if (rng() < pCorrect) {
        answers[q.id] = q.answer;
        score += 1;
      } else {
        const wrong = q.choices.filter((c) => c.id !== q.answer);
        if (wrong.length === 0) {
          answers[q.id] = q.answer;
          score += 1;
        } else {
          // 65% เลือกตัวลวงตัวแรก (ตัวลวงยอดนิยม) → เกิด misconception ร่วม
          const idx = rng() < 0.65 ? 0 : Math.floor(rng() * wrong.length);
          answers[q.id] = wrong[Math.min(idx, wrong.length - 1)].id;
        }
      }
    }

    const total = quiz.questions.length;
    return {
      id: `mock-${quiz.revision}-${student.id}`,
      studentId: student.id,
      studentName: student.name,
      week: quiz.week,
      quizRevision: quiz.revision,
      answers,
      score,
      total,
      percent: total > 0 ? Math.round((score / total) * 100) : 0,
      // เวลาส่งไล่กันคนละไม่กี่นาที เพื่อให้ดูเป็นธรรมชาติ
      submittedAt: new Date(
        Date.now() - (i + 1) * 37 * 60 * 1000,
      ).toISOString(),
    };
  });
}
