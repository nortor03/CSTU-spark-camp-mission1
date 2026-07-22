"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCourse } from "@/lib/courseStore";
import { buildStudentSummary } from "@/lib/analytics";
import PageHeader from "@/components/ui/PageHeader";
import MasteryBar, { MasteryLegend } from "@/components/ui/MasteryBar";

/**
 * หน้าสรุปผลการเรียนรู้ของนักเรียน 1 คน 1 สัปดาห์
 * ตอบข้อ 6 ของ mission: "สรุป strong points / weak points ของนักศึกษา"
 */
export default function StudentSummary({ week }: { week: string }) {
  const { getQuiz, submissions, studentId, hydrated } = useCourse();

  const quiz = getQuiz(week);

  // ผลล่าสุดของผู้ใช้คนนี้ในสัปดาห์นี้
  const mine = useMemo(
    () =>
      submissions
        .filter((s) => s.week === week && s.isCurrentUser)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0],
    [submissions, week],
  );

  const summary = useMemo(
    () => (quiz && mine ? buildStudentSummary(quiz, mine.answers) : null),
    [quiz, mine],
  );

  if (!hydrated) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  if (!quiz || !mine || !summary) {
    return (
      <div className="card-empty">
        <h2 className="display text-lg">ยังไม่มีผลของ {week}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
          ต้องทำแบบทดสอบของสัปดาห์นี้ก่อน ระบบจึงจะสรุปจุดแข็งและจุดอ่อนให้ได้
        </p>
        <Link href="/student" className="btn-primary mt-5">
          ไปเลือกแบบทดสอบ
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={`สรุปผลการเรียนรู้ · ${week}`}
        title="จุดแข็งและจุดอ่อนของคุณ"
        subtitle={summary.headline}
        tone="gold"
        action={
          <Link href={`/student/quiz/${week.match(/\d+/)?.[0] ?? ""}`} className="btn-secondary">
            ทำแบบทดสอบซ้ำ
          </Link>
        }
      />

      {/* ---------- คะแนนรวม ---------- */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="card px-5 py-4">
          <p className="text-[11px] font-semibold text-ink-500">คะแนนรวม</p>
          {/* ตัวเลขพระเอกใช้ฟอนต์ sans เดียวกับทั้งระบบ ไม่ใช้ serif */}
          <p className="mt-1 text-3xl font-bold leading-none text-ink-900">
            {summary.percent}
            <span className="text-base font-semibold text-ink-400">%</span>
          </p>
          <p className="mt-1.5 text-xs text-ink-500">
            ถูก {summary.score} จาก {summary.total} ข้อ
          </p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-[11px] font-semibold text-ink-500">หัวข้อที่เข้าใจดี</p>
          <p className="mt-1 text-3xl font-bold leading-none text-[#047857]">
            {summary.strong.length}
          </p>
          <p className="mt-1.5 text-xs text-ink-500">
            จากทั้งหมด {summary.topics.length} หัวข้อ
          </p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-[11px] font-semibold text-ink-500">หัวข้อที่ควรทบทวน</p>
          <p className="mt-1 text-3xl font-bold leading-none text-tu-red-500">
            {summary.weak.length}
          </p>
          <p className="mt-1.5 text-xs text-ink-500">
            จากทั้งหมด {summary.topics.length} หัวข้อ
          </p>
        </div>
      </div>

      {/* ---------- ความเข้าใจรายหัวข้อ ---------- */}
      <section className="card mb-4 p-5 sm:p-6">
        <h2 className="display text-lg">ความเข้าใจรายหัวข้อ</h2>
        <p className="mt-1 text-xs text-ink-500">
          คิดจากสัดส่วนข้อที่ตอบถูกในแต่ละหัวข้อของแบบทดสอบสัปดาห์นี้
        </p>
        <hr className="rule-gold my-4" />

        <div className="divide-y divide-line-soft">
          {summary.topics.map((t) => (
            <MasteryBar key={t.topic} item={t} />
          ))}
        </div>

        <div className="mt-4 border-t border-line-soft pt-3">
          <MasteryLegend />
        </div>
      </section>

      {/* ---------- ความเข้าใจที่คลาดเคลื่อน ---------- */}
      {summary.misconceptions.length > 0 && (
        <section className="card mb-4 p-5 sm:p-6">
          <h2 className="display text-lg">จุดที่เข้าใจคลาดเคลื่อน</h2>
          <p className="mt-1 text-xs text-ink-500">
            เทียบคำตอบที่คุณเลือกกับคำตอบที่ถูก เพื่อให้เห็นว่าเข้าใจต่างจากเนื้อหาตรงไหน
          </p>
          <hr className="rule-gold my-4" />

          <ul className="space-y-3">
            {summary.misconceptions.map((m, i) => (
              <li key={i} className="rounded-lg border border-line bg-paper-50 p-3.5">
                <p className="text-[11px] font-semibold text-tu-gold-700">
                  {m.topic}
                </p>
                <p className="mt-1 text-sm font-medium text-ink-800">
                  {m.question}
                </p>
                <div className="mt-2.5 space-y-1 text-xs">
                  <p className="flex gap-2 text-tu-red-700">
                    <span className="flex-shrink-0 font-bold">คุณตอบ</span>
                    <span>{m.chosenText}</span>
                  </p>
                  <p className="flex gap-2 text-[#047857]">
                    <span className="flex-shrink-0 font-bold">คำตอบที่ถูก</span>
                    <span>{m.correctText}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- ขั้นถัดไป ---------- */}
      <section className="card p-5 sm:p-6">
        <h2 className="display text-lg">คำแนะนำขั้นถัดไปจาก AI</h2>
        <hr className="rule-gold my-4" />
        <ul className="space-y-2.5">
          {summary.nextSteps.map((s, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-md border-l-2 border-tu-gold-500 bg-paper-50 px-3.5 py-2.5 text-sm leading-relaxed text-ink-700"
            >
              <span className="flex-shrink-0 font-bold text-tu-gold-700">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ul>

        <p className="mt-4 border-t border-line-soft pt-3 text-[11px] leading-relaxed text-ink-400">
          สรุปนี้สร้างจากผลแบบทดสอบปรนัยเท่านั้น จึงสะท้อนความเข้าใจได้บางส่วน
          ควรใช้ประกอบกับการทบทวนเนื้อหาและการพูดคุยกับอาจารย์
        </p>
      </section>
    </div>
  );
}
