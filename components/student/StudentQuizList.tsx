"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import { resolveHex, weekNumber } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";

interface QuizRow {
  courseId: string;
  week: string;
  count: number;
  colorKey: string;
}

/**
 * หน้ารายการแบบทดสอบสำหรับนักเรียน
 * รวมแบบทดสอบจากทุกวิชา จัดกลุ่มตามวิชา
 * (นักเรียนหนึ่งคนอาจลงเรียนหลายวิชา)
 */
export default function StudentQuizList() {
  const { courses, setActiveCourse, hydrated } = useCourse();
  const router = useRouter();

  const groups = useMemo(
    () =>
      courses
        .map((c) => ({
          courseId: c.id,
          subject: c.subject,
          rows: Object.entries(c.quizzes)
            // นักเรียนเห็นเฉพาะ "ชุดที่อาจารย์ตั้งเป็น active" ของแต่ละสัปดาห์
            .map<QuizRow | null>(([week, list]) => {
              const active = list.find((q) => q.isActive);
              if (!active) return null;
              return {
                courseId: c.id,
                week,
                count: active.questions.length,
                colorKey: c.weekConfig[week]?.colorKey ?? "red",
              };
            })
            .filter((r): r is QuizRow => r !== null)
            .sort(
              (a, b) => Number(weekNumber(a.week)) - Number(weekNumber(b.week)),
            ),
        }))
        .filter((g) => g.rows.length > 0),
    [courses],
  );

  /** ตั้งวิชาที่เลือกเป็น active ก่อน แล้วจึงไปหน้าทำแบบทดสอบ */
  function openQuiz(row: QuizRow) {
    setActiveCourse(row.courseId);
    router.push(`/student/quiz/${weekNumber(row.week)}`);
  }

  if (!hydrated) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="ทดสอบความเข้าใจ"
        title="แบบทดสอบ"
        tone="gold"
      />

      {groups.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีแบบทดสอบ</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            อาจารย์ยังไม่ได้สร้างแบบทดสอบ กลับมาใหม่อีกครั้งภายหลัง
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.courseId}>
              {/* หัวข้อวิชา — แสดงเสมอเพื่อให้รู้ว่าแบบทดสอบอยู่วิชาไหน */}
              <h2 className="mb-2 px-1 text-sm font-bold text-ink-700">
                {g.subject}
              </h2>
              <div className="card divide-y divide-line-soft overflow-hidden">
                {g.rows.map((row) => (
                  <button
                    key={`${row.courseId}-${row.week}`}
                    type="button"
                    onClick={() => openQuiz(row)}
                    className="group flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-paper-100/70 sm:px-5"
                  >
                    <div className="flex flex-shrink-0 items-center gap-3">
                      <span
                        className="h-10 w-1 rounded-full"
                        style={{ backgroundColor: resolveHex(row.colorKey) }}
                        aria-hidden
                      />
                      <span className="w-7 text-2xl font-bold leading-none text-ink-300 transition group-hover:text-ink-500">
                        {weekNumber(row.week)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink-800">
                        {row.week}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {row.count} ข้อ
                      </p>
                    </div>

                    <span className="flex-shrink-0 text-xs font-bold text-tu-red-600 transition group-hover:text-tu-red-700">
                      เริ่มทำ →
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
