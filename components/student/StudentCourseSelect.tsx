"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCourse } from "@/lib/courseStore";
import PageHeader from "@/components/ui/PageHeader";
import { ChevronRight, Calendar, ClipboardCheck, Edit3 } from "lucide-react";

/**
 * หน้าแรกฝั่งนักเรียน — เลือกรายวิชาก่อน (นักเรียนอาจลงเรียนหลายวิชา)
 * เลือกวิชาแล้วจึงไปดูสัปดาห์/แบบทดสอบของวิชานั้น
 */
export default function StudentCourseSelect() {
  const { courses, studentId, hydrated } = useCourse();

  // คำนวณความคืบหน้าของนักศึกษาแบบเรียลไทม์
  const items = useMemo(() => {
    return courses.map((c) => {
      const code = c.courseCode || "วิชา";
      const activeWeek = c.courseCode === "CN101" ? 4 : c.courseCode === "CS232" ? 7 : c.courseCode === "GE145" ? 9 : 1;
      
      // ดึงควิซทั้งหมดที่เปิดใช้งานในวิชานี้จริง
      const totalQuizzes = Object.values(c.quizzes).filter((list) =>
        list.some((q) => q.isActive)
      ).length;

      // ดึงจำนวนควิซที่ผู้ใช้งานนี้ส่งทำแล้วจริง
      const doneQuizzes = c.submissions.filter(
        (s) => s.studentId === studentId || s.isCurrentUser
      ).length;

      // ดึงจำนวนบันทึกสรุปที่บันทึกจริงใน localStorage
      let doneSummaries = 0;
      if (typeof window !== "undefined") {
        for (let w = 1; w <= c.totalWeeks; w++) {
          const key = `tonlabkit:note:${studentId ?? "anon"}:${c.id}:สัปดาห์ที่ ${w}`;
          try {
            if (localStorage.getItem(key)) {
              doneSummaries++;
            }
          } catch {}
        }
      }

      return {
        id: c.id,
        code,
        subject: c.subject,
        activeWeek,
        totalWeeks: c.totalWeeks || 12,
        doneQuizzes,
        totalQuizzes,
        doneSummaries,
      };
    });
  }, [courses, studentId]);

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
        eyebrow="ระบบทบทวนและประเมินผลการเรียนรู้" 
        title="รายวิชาเรียนของฉัน" 
        subtitle="เข้าสู่บทเรียน ทำแบบทดสอบทบทวนรายสัปดาห์ และตรวจดูบทวิเคราะห์ผลการเรียนรู้ของตนเองได้เลย"
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

                {/* สถิติ 2 คอลัมน์ (จัดให้เห็นคำครบถ้วน) */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-center gap-1.5 rounded-xl bg-paper-50 p-2">
                    <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded bg-tu-red-50 text-tu-red-600">
                      <ClipboardCheck className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-ink-400 uppercase tracking-tight">ทำแบบทดสอบ</p>
                      <p className="text-xs font-bold text-ink-800 whitespace-nowrap">
                        {c.doneQuizzes} / {c.totalQuizzes} ชุด
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-xl bg-paper-50 p-2">
                    <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded bg-amber-50 text-amber-600">
                      <Edit3 className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-ink-400 uppercase tracking-tight">บันทึกสรุป</p>
                      <p className="text-xs font-bold text-ink-800 whitespace-nowrap">
                        {c.doneSummaries} / {c.totalWeeks} สัปดาห์
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ปุ่มเข้าเรียน */}
              <div className="mt-5">
                <Link
                  href={`/student/course/${c.id}`}
                  className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-tu-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-tu-red-700 active:scale-95"
                >
                  <span>เข้าเรียน</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
