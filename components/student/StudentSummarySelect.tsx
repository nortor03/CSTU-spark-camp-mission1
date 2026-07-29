"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCourse } from "@/lib/courseStore";
import PageHeader from "@/components/ui/PageHeader";
import { ClipboardCheck, TrendingUp } from "lucide-react";

/**
 * หน้าแรกของเมนู "จุดแข็ง/จุดอ่อน" — เลือกวิชาก่อน (flow เดียวกับหน้ารายวิชา)
 * เลือกวิชาแล้วจึงไปดูสรุปภาพรวมจากควิซที่ทำ (การ์ดสไตล์เดียวกับหน้าเลือกรายวิชา)
 */
export default function StudentSummarySelect() {
  const { courses, studentId, hydrated } = useCourse();

  const items = useMemo(
    () =>
      courses.map((c) => {
        const mySubs = c.submissions.filter(
          (s) => s.isCurrentUser || s.studentId === studentId,
        );
        const doneWeeks = new Set(mySubs.map((s) => s.week)).size;
        const avgPercent =
          mySubs.length > 0
            ? Math.round(
                mySubs.reduce((sum, s) => sum + s.percent, 0) / mySubs.length,
              )
            : null;
        return {
          id: c.id,
          code: c.courseCode || "วิชา",
          subject: c.subject,
          doneWeeks,
          avgPercent,
        };
      }),
    [courses, studentId],
  );

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
        eyebrow="ดูจุดแข็ง / จุดอ่อนของตัวเอง"
        title="สรุปผลของฉัน"
        subtitle="เลือกรายวิชาเพื่อดูภาพรวมจุดแข็งและจุดอ่อนจากแบบทดสอบที่ทำแล้ว"
        tone="gold"
      />

      {items.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีรายวิชา</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            อาจารย์ยังไม่ได้เปิดรายวิชา กลับมาใหม่อีกครั้งภายหลัง
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[1100px]">
          {items.map((c) => (
            <div
              key={c.id}
              className="group relative flex w-full max-w-[360px] flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-sm"
            >
              <div className="space-y-4">
                {/* แถวบนสุด: รหัสวิชา */}
                <div className="text-xs">
                  <span className="font-bold text-ink-400 uppercase tracking-wider">{c.code}</span>
                </div>

                {/* ชื่อวิชา */}
                <h3 className="text-base font-bold text-ink-900 leading-snug group-hover:text-tu-red-700 transition-colors">
                  {c.subject}
                </h3>

                {/* สถิติ 2 คอลัมน์ */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-center gap-1.5 rounded-xl bg-paper-50 p-2">
                    <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded bg-tu-red-50 text-tu-red-600">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-ink-400 uppercase tracking-tight">ทำแบบทดสอบ</p>
                      <p className="text-xs font-bold text-ink-800 whitespace-nowrap">
                        {c.doneWeeks} สัปดาห์
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-xl bg-paper-50 p-2">
                    <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded bg-amber-50 text-amber-600">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-ink-400 uppercase tracking-tight">คะแนนเฉลี่ย</p>
                      <p className="text-xs font-bold text-ink-800 whitespace-nowrap">
                        {c.avgPercent !== null ? `${c.avgPercent}%` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ปุ่มดูสรุป */}
              <div className="mt-5">
                <Link
                  href={`/student/summary/course/${c.id}`}
                  className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-tu-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-tu-red-700 active:scale-95"
                >
                  <span>ดูจุดแข็ง / จุดอ่อน</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
