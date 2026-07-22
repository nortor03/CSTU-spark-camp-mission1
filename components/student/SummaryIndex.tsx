"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import { levelOf, LEVEL_META, type Submission } from "@/lib/analytics";
import { resolveHex, weekNumber } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";

/** รายการผลการทำแบบทดสอบของนักเรียนคนนี้ ครอบทุกวิชา จัดกลุ่มตามวิชา */
export default function SummaryIndex() {
  const { courses, setActiveCourse, hydrated } = useCourse();
  const router = useRouter();

  const groups = useMemo(
    () =>
      courses
        .map((c) => ({
          courseId: c.id,
          subject: c.subject,
          colorKey: (week: string) => c.weekConfig[week]?.colorKey ?? "red",
          rows: c.submissions
            .filter((s) => s.isCurrentUser)
            .sort(
              (a, b) =>
                Number(weekNumber(a.week)) - Number(weekNumber(b.week)),
            ),
        }))
        .filter((g) => g.rows.length > 0),
    [courses],
  );

  function openSummary(courseId: string, s: Submission) {
    setActiveCourse(courseId);
    router.push(`/student/summary/${weekNumber(s.week)}`);
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
        eyebrow="วิเคราะห์ผลการเรียน"
        title="คำแนะนำรายสัปดาห์"
        tone="gold"
      />

      {groups.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีผลการทำแบบทดสอบ</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            เมื่อทำแบบทดสอบเสร็จ ระบบจะสรุปจุดแข็งและจุดอ่อนของคุณไว้ที่นี่
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.courseId}>
              <h2 className="mb-2 px-1 text-sm font-bold text-ink-700">
                {g.subject}
              </h2>
              <div className="card divide-y divide-line-soft overflow-hidden">
                {g.rows.map((s) => {
                  const meta = LEVEL_META[levelOf(s.percent)];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => openSummary(g.courseId, s)}
                      className="group flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-paper-100/70 sm:px-5"
                    >
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <span
                          className="h-10 w-1 rounded-full"
                          style={{
                            backgroundColor: resolveHex(g.colorKey(s.week)),
                          }}
                          aria-hidden
                        />
                        <span className="w-7 text-2xl font-bold leading-none text-ink-300 transition group-hover:text-ink-500">
                          {weekNumber(s.week)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink-800">
                          {s.week}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                          <span style={{ color: meta.hex }} aria-hidden>
                            {meta.icon}
                          </span>
                          {meta.label} · ถูก {s.score}/{s.total} ข้อ
                        </p>
                      </div>

                      <span className="flex-shrink-0 text-sm font-bold tabular-nums text-ink-800">
                        {s.percent}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
