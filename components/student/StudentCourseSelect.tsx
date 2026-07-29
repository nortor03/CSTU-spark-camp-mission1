"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCourse } from "@/lib/courseStore";
import {
  fetchCourses,
  fetchCourse,
  type CourseSummary,
  type CourseOut,
} from "@/lib/coursesApi";
import { fetchCourseQuizzes } from "@/lib/quizzesApi";
import { fetchStudentSubmissions } from "@/lib/quizGradingApi";
import { fetchWeekNote } from "@/lib/notesApi";
import { weekOptions, DEFAULT_WEEK_COUNT } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";
import { ClipboardCheck, Edit3 } from "lucide-react";
import type { Quiz } from "@/lib/quiz";

interface CourseProgress {
  id: string;
  code: string;
  subject: string;
  totalWeeks: number;
  totalQuizzes: number;
  doneQuizzes: number;
  doneSummaries: number;
}

/** นับจำนวนควิซ (ที่ active) ที่นักเรียนคนนี้ส่งคำตอบไปแล้วอย่างน้อย 1 ครั้ง */
async function countDoneQuizzes(
  activeQuizzes: Quiz[],
  studentId: string,
): Promise<number> {
  const results = await Promise.all(
    activeQuizzes.map((q) =>
      fetchStudentSubmissions(q.id, studentId)
        .then((subs) => subs.length > 0)
        .catch(() => false),
    ),
  );
  return results.filter(Boolean).length;
}

/** นับจำนวนสัปดาห์ที่นักเรียนคนนี้บันทึกสรุปไว้แล้ว (จาก backend โดยตรง) */
async function countDoneSummaries(
  courseId: string,
  weekCount: number,
  studentId: string,
): Promise<number> {
  const weeks = weekOptions(weekCount || DEFAULT_WEEK_COUNT);
  const results = await Promise.all(
    weeks.map((w) =>
      fetchWeekNote(courseId, w, studentId)
        .then((note) => !!note.text)
        .catch(() => false),
    ),
  );
  return results.filter(Boolean).length;
}

/**
 * ดึงความคืบหน้าของนักเรียนคนนี้ในวิชาหนึ่ง — ควิซ+บันทึกสรุปทั้งหมดมาจาก backend จริง
 * ระหว่างทางเติมรายละเอียดวิชา/ควิซเข้า local store ไว้ด้วย (best-effort) เผื่อกดเข้า
 * หน้ารายละเอียดวิชาต่อ จะได้ไม่ต้องรอโหลดซ้ำ
 */
async function loadCourseProgress(
  summary: CourseSummary,
  studentId: string,
  importCourse: (course: CourseOut) => void,
  importQuizzes: (courseId: string, quizzes: Quiz[]) => void,
): Promise<CourseProgress> {
  const courseId = summary.course_id;

  fetchCourse(courseId).then(importCourse).catch(() => {});

  let quizzes: Quiz[] = [];
  try {
    quizzes = await fetchCourseQuizzes(courseId);
    importQuizzes(courseId, quizzes);
  } catch {
    quizzes = [];
  }
  const activeQuizzes = quizzes.filter((q) => q.isActive);

  const [doneQuizzes, doneSummaries] = await Promise.all([
    countDoneQuizzes(activeQuizzes, studentId),
    countDoneSummaries(courseId, summary.week_count, studentId),
  ]);

  return {
    id: courseId,
    code: summary.course_code || "วิชา",
    subject: summary.subject,
    totalWeeks: summary.week_count || DEFAULT_WEEK_COUNT,
    totalQuizzes: summary.quiz_count,
    doneQuizzes,
    doneSummaries,
  };
}

/**
 * หน้าแรกฝั่งนักเรียน — เลือกรายวิชาก่อน (นักเรียนอาจลงเรียนหลายวิชา)
 * ดึงรายชื่อวิชาและความคืบหน้าของนักเรียนคนนี้จาก backend โดยตรง
 * (ไม่ใช้วิชา mock ที่ seed ไว้ใน localStorage อีกต่อไป)
 * เลือกวิชาแล้วจึงไปดูสัปดาห์/แบบทดสอบของวิชานั้น
 */
export default function StudentCourseSelect() {
  const { studentId, hydrated, importCourse, importQuizzes } = useCourse();
  const [items, setItems] = useState<CourseProgress[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!studentId) {
      setItems([]);
      return;
    }

    let cancelled = false;
    setLoadError(false);

    fetchCourses()
      .then(async (summaries) => {
        const results = await Promise.all(
          summaries.map((s) =>
            loadCourseProgress(s, studentId, importCourse, importQuizzes),
          ),
        );
        if (!cancelled) setItems(results);
      })
      .catch((err) => {
        console.warn("ไม่สามารถดึงรายวิชาจาก backend ได้", err);
        if (!cancelled) {
          setItems([]);
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
    // หมายเหตุ: ตั้งใจไม่ใส่ importCourse/importQuizzes ใน deps — ฟังก์ชันทั้งสองถูก
    // สร้างใหม่ทุกครั้งที่ CourseProvider re-render (ไม่ได้ห่อ useCallback) และตัว
    // effect นี้เองก็เรียกมันข้างใน (ทำให้ store อัปเดต → provider re-render → ได้
    // ฟังก์ชันอ้างอิงใหม่) ถ้าใส่ไว้ใน deps จะวนลูปยิง fetchCourses() ไม่รู้จบ (cancel
    // ตัวเองก่อนโหลดเสร็จทุกรอบ) จึงต้องคุมด้วย hydrated/studentId อย่างเดียวพอ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, studentId]);

  if (!hydrated || items === null) {
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
          <h2 className="display text-lg">
            {loadError ? "โหลดรายวิชาไม่สำเร็จ" : "ยังไม่มีรายวิชา"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            {loadError
              ? "เชื่อมต่อ backend ไม่ได้ ลองรีเฟรชหน้าอีกครั้ง"
              : "อาจารย์ยังไม่ได้เปิดรายวิชา กลับมาใหม่อีกครั้งภายหลัง"}
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
