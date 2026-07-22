"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useCourse } from "@/lib/courseStore";
import { buildClassReport, LEVEL_META, type Submission } from "@/lib/analytics";
import { generateMockSubmissions } from "@/lib/mockClass";
import { weekNumber } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";
import MasteryBar, { MasteryLegend } from "@/components/ui/MasteryBar";

/**
 * รายงานภาพรวมทั้งชั้นเรียนของ 1 สัปดาห์ ในวิชาหนึ่ง (สำหรับอาจารย์)
 * ตอบข้อ 7 ของ mission: "รายงาน/dashboard สรุปภาพรวมของทั้งชั้นเรียน"
 */
export default function ClassReport({
  courseId,
  week,
}: {
  courseId: string;
  week: string;
}) {
  const { getCourse, setActiveCourse, activeCourseId, hydrated } = useCourse();
  const course = getCourse(courseId);
  const quiz = course?.quizzes[week];

  // ตั้งวิชานี้เป็น active เพื่อให้ลิงก์ไป /quiz ทำงานกับวิชาที่ถูกต้อง
  useEffect(() => {
    if (course && activeCourseId !== courseId) setActiveCourse(courseId);
  }, [course, courseId, activeCourseId, setActiveCourse]);

  // ผลจริงของผู้ใช้ + เพื่อนร่วมชั้นจำลอง (prototype ยังไม่มีหลายผู้ใช้จริง)
  const allSubmissions = useMemo<Submission[]>(() => {
    if (!quiz || !course) return [];
    const real = course.submissions.filter((s) => s.week === week);
    return [...generateMockSubmissions(quiz), ...real];
  }, [quiz, course, week]);

  const report = useMemo(
    () => (quiz ? buildClassReport(quiz, allSubmissions) : null),
    [quiz, allSubmissions],
  );

  if (!hydrated) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  if (!quiz || !report) {
    return (
      <div className="card-empty">
        <h2 className="display text-lg">ยังไม่มีแบบทดสอบของ {week}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
          ต้องสร้างแบบทดสอบของสัปดาห์นี้ก่อน จึงจะมีข้อมูลให้สรุปภาพรวมได้
        </p>
        <Link href={`/quiz/${weekNumber(week)}`} className="btn-primary mt-5">
          ไปสร้างแบบทดสอบ
        </Link>
      </div>
    );
  }

  const maxBucket = Math.max(...report.distribution.map((b) => b.count), 1);

  return (
    <div>
      <PageHeader
        eyebrow="รายงานผลการเรียนรู้รายสัปดาห์"
        title={report.week}
        action={
          <Link href={`/quiz/${weekNumber(week)}`} className="btn-secondary">
            ดู / แก้แบบทดสอบ
          </Link>
        }
      />

      {/* ---------- ตัวเลขสำคัญ ---------- */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="ผู้ส่งคำตอบ" value={report.studentCount} unit="คน" />
        <Kpi label="คะแนนเฉลี่ย" value={report.average} unit="%" />
        <Kpi label="มัธยฐาน" value={report.median} unit="%" />
        <Kpi label="ผ่านเกณฑ์ 50%" value={report.passRate} unit="%" />
      </div>

      {/* ---------- สิ่งที่ควรทำในคาบถัดไป ---------- */}
      <section className="card mb-4 overflow-hidden">
        <div className="h-1 bg-tu-gold-500" aria-hidden />
        <div className="p-5 sm:p-6">
          <h2 className="display text-lg">ข้อเสนอสำหรับคาบถัดไป</h2>
          <p className="mt-1 text-xs text-ink-500">
            สรุปจากหัวข้อที่ทั้งห้องทำได้ต่ำ และตัวเลือกผิดที่ซ้ำกันบ่อย
          </p>
          <hr className="rule-gold my-4" />
          <ul className="space-y-2.5">
            {report.reviewPlan.map((p, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-md bg-paper-50 px-3.5 py-2.5 text-sm leading-relaxed text-ink-700"
              >
                <span className="flex-shrink-0 font-bold text-tu-red-600">
                  {i + 1}
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        {/* ---------- การกระจายคะแนน ---------- */}
        <section className="card p-5 sm:p-6">
          <h2 className="display text-lg">การกระจายคะแนน</h2>
          <p className="mt-1 text-xs text-ink-500">
            จำนวนนักศึกษาในแต่ละช่วงคะแนน
          </p>
          <hr className="rule-gold my-4" />

          <div className="space-y-3">
            {report.distribution.map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="w-20 flex-shrink-0 text-xs tabular-nums text-ink-600">
                  {b.label}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-paper-200">
                  <div
                    className="h-full rounded bg-tu-red-500"
                    style={{ width: `${(b.count / maxBucket) * 100}%` }}
                    role="img"
                    aria-label={`${b.label}: ${b.count} คน`}
                  />
                </div>
                <span className="w-10 flex-shrink-0 text-right text-xs font-bold tabular-nums text-ink-800">
                  {b.count}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ink-400">หน่วย: จำนวนคน</p>
        </section>

        {/* ---------- ความเข้าใจรายหัวข้อของทั้งห้อง ---------- */}
        <section className="card p-5 sm:p-6">
          <h2 className="display text-lg">ความเข้าใจรายหัวข้อ</h2>
          <p className="mt-1 text-xs text-ink-500">
            เรียงจากหัวข้อที่ทั้งห้องทำได้ต่ำที่สุด
          </p>
          <hr className="rule-gold my-4" />

          <div className="divide-y divide-line-soft">
            {report.topics.map((t) => (
              <MasteryBar key={t.topic} item={t} />
            ))}
          </div>

          <div className="mt-4 border-t border-line-soft pt-3">
            <MasteryLegend />
          </div>
        </section>
      </div>

      {/* ---------- ข้อที่ตอบถูกน้อยที่สุด ---------- */}
      <section className="card mb-4 p-5 sm:p-6">
        <h2 className="display text-lg">ข้อที่นักศึกษาพลาดมากที่สุด</h2>
        <p className="mt-1 text-xs text-ink-500">
          ตัวเลือกผิดที่ซ้ำกันบ่อยมักบอกความเข้าใจคลาดเคลื่อนร่วมของห้อง
        </p>
        <hr className="rule-gold my-4" />

        <div className="space-y-3">
          {report.hardest.map((h, i) => {
            const level =
              h.correctRate >= 80
                ? "strong"
                : h.correctRate < 50
                  ? "weak"
                  : "medium";
            const meta = LEVEL_META[level];
            return (
              <div
                key={h.question.id}
                className="rounded-lg border border-line bg-paper-50 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-sm font-medium text-ink-800">
                    <span className="mr-1.5 font-bold text-ink-300">
                      {i + 1}
                    </span>
                    {h.question.question}
                  </p>
                  <span
                    className="flex flex-shrink-0 items-baseline gap-1 text-xs font-bold tabular-nums"
                    style={{ color: meta.hex }}
                  >
                    <span aria-hidden>{meta.icon}</span>
                    {h.correctRate}%
                  </span>
                </div>

                <p className="mt-1.5 text-[11px] text-tu-gold-700">{h.topic}</p>

                {h.topWrongCount > 0 && (
                  <p className="mt-2 border-t border-line-soft pt-2 text-xs text-ink-600">
                    <span className="font-semibold text-ink-700">
                      ตัวเลือกผิดยอดนิยม:
                    </span>{" "}
                    {/* ไม่ครอบอัญประกาศซ้ำ เพราะตัวเลือกมีเครื่องหมายคำพูดอยู่แล้ว */}
                    <span className="text-tu-red-700">{h.topWrongText}</span> —
                    เลือกโดย {h.topWrongCount} คน
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-ink-400">
          % = สัดส่วนนักศึกษาที่ตอบข้อนั้นถูก
        </p>
      </section>

      {/* ---------- ตารางรายคน ---------- */}
      <section className="card p-5 sm:p-6">
        <h2 className="display text-lg">ผลรายบุคคล</h2>
        <hr className="rule-gold my-4" />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-500">
                <th className="pb-2 font-semibold">รหัส</th>
                <th className="pb-2 font-semibold">ชื่อ</th>
                <th className="pb-2 text-right font-semibold">ถูก</th>
                <th className="pb-2 text-right font-semibold">คะแนน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {[...allSubmissions]
                .sort((a, b) => a.percent - b.percent)
                .map((s) => (
                  <tr key={s.id} className={s.isCurrentUser ? "bg-tu-gold-50" : ""}>
                    <td className="py-2 tabular-nums text-ink-600">
                      {s.studentId}
                    </td>
                    <td className="py-2 text-ink-800">
                      {s.studentName}
                      {s.isCurrentUser && (
                        <span className="ml-2 rounded-full bg-tu-gold-100 px-2 py-0.5 text-[10px] font-bold text-tu-gold-700">
                          คุณ
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums text-ink-600">
                      {s.score}/{s.total}
                    </td>
                    <td className="py-2 text-right font-bold tabular-nums text-ink-900">
                      {s.percent}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 border-t border-line-soft pt-3 text-[11px] leading-relaxed text-ink-400">
          ต้นแบบนี้ใช้ข้อมูลเพื่อนร่วมชั้นจำลองประกอบ เพื่อให้เห็นภาพรวมของห้อง
          ในระบบจริงควรแสดงผลรวมแบบไม่ระบุตัวตนเป็นค่าเริ่มต้น
          และเปิดดูรายบุคคลเฉพาะเมื่อจำเป็น
        </p>
      </section>
    </div>
  );
}

/** กล่องตัวเลขสำคัญ 1 ช่อง */
function Kpi({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="card px-4 py-3.5">
      <p className="text-[11px] font-semibold text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-bold leading-none text-ink-900">
        {value}
        <span className="ml-0.5 text-sm font-semibold text-ink-400">
          {unit}
        </span>
      </p>
    </div>
  );
}
