import type { Quiz, QuizPrompt } from "./quiz";
import { generateMockQuiz } from "./quiz";

/* ==========================================================================
   จุดเชื่อม AI สำหรับ "สร้างควิซจากโจทย์" (AI seam)

   ตอนนี้ยังไม่มี AI จริงให้ต่อ → ข้างในเป็น MOCK (สุ่มสร้างคำถามจำลอง)
   โครงถูกออกแบบให้ "สลับเป็น AI จริงได้โดยแก้ที่เดียว" — ส่วน UI ทั้งหมด
   (หน้ากรอกโจทย์ / หน้าแก้ไข / แชทบอท) เรียกผ่านฟังก์ชันนี้เท่านั้น

   ▶ วิธีต่อ AI จริงในอนาคต (เช่น Claude):
     1. สร้าง route ฝั่ง server: app/api/quiz-generate/route.ts
        (เก็บ ANTHROPIC_API_KEY ไว้ฝั่ง server เท่านั้น — ห้าม NEXT_PUBLIC_)
     2. เปลี่ยน body ของฟังก์ชันนี้เป็น:
          const res = await fetch("/api/quiz-generate", {
            method: "POST",
            body: JSON.stringify({ week, prompt }),
          });
          return (await res.json()) as Quiz;
     3. ให้ AI คืนโครง Quiz (id/week/title/questions[...]) แล้วจบ — UI ไม่ต้องแก้
   ========================================================================== */

/** สร้างควิซจากโจทย์ที่อาจารย์กรอก (async เผื่อการเรียก AI จริงในอนาคต) */
export async function generateQuizJSON(
  week: string,
  prompt: QuizPrompt,
): Promise<Quiz> {
  // จำลองความหน่วงของการเรียก AI ให้ UX เหมือนกำลัง "คิดข้อสอบ"
  await new Promise((resolve) => setTimeout(resolve, 900));

  // TODO(AI): แทนบรรทัดล่างด้วยการเรียก AI จริง (ดูหมายเหตุด้านบน)
  return generateMockQuiz(week, prompt);
}
