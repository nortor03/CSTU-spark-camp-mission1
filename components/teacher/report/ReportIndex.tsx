"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCourses, type CourseSummary } from "@/lib/coursesApi";
import { fetchCourseQuizzes } from "@/lib/quizzesApi";
import { fetchQuizSubmissions } from "@/lib/quizGradingApi";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonCardGrid } from "@/components/ui/Skeleton";
import { CalendarDays, Users } from "lucide-react";

/**
 * หน้ารายงานชั้นเรียน (ระดับบนสุด) — เลือกวิชาก่อน (การ์ดสไตล์เดียวกับหน้ารายวิชา)
 * เพราะอาจารย์หนึ่งคนสอนได้หลายวิชา
 * ดึงรายวิชาจาก backend จริง (GET /api/v1/courses) โดยตรง — ไม่ fallback ไปข้อมูล
 * ในเครื่อง ถ้า backend ไม่มีวิชาก็แสดง empty state จริง ไม่ปั้นข้อมูลมาโชว์
 */
export default function ReportIndex() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchCourses()
      .then((items) => {
        if (cancelled) return;
        setCourses(items);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("โหลดรายวิชาจาก backend ไม่สำเร็จ", err);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <SkeletonCardGrid />;
  }

  if (status === "error") {
    return (
      <div className="grid place-items-center py-24 text-sm text-tu-red-600">
        โหลดรายวิชาไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="เลือกวิชาที่ต้องการดูรายงาน"
        title="รายงานผลการเรียนรู้"
      />

      {courses.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีรายวิชา</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            สร้างรายวิชาและแบบทดสอบก่อน จึงจะมีรายงานให้ดู
          </p>
          <Link href="/course/new" className="btn-primary mt-5">
            + เพิ่มรายวิชาใหม่
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[1100px]">
          {courses.map((c) => (
            <ReportCourseCard key={c.course_id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCourseCard({ course }: { course: CourseSummary }) {
  const [studentCount, setStudentCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStudentCount(null);
    fetchCourseQuizzes(course.course_id)
      .then(async (quizzes) => {
        const activeIds = quizzes.filter((q) => q.isActive).map((q) => q.id);
        const results = await Promise.all(
          activeIds.map((id) => fetchQuizSubmissions(id).catch(() => [])),
        );
        if (cancelled) return;
        const ids = new Set<string>();
        for (const subs of results) for (const s of subs) ids.add(s.studentId);
        setStudentCount(ids.size);
      })
      .catch(() => {
        if (!cancelled) setStudentCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [course.course_id]);

  return (
    <div className="group relative flex w-full max-w-[360px] flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-sm">
      <div className="space-y-4">
        {/* แถวบนสุด: รหัสวิชา */}
        <div className="text-xs">
          <span className="font-bold text-ink-400 uppercase tracking-wider">
            {course.course_code || "วิชา"}
          </span>
        </div>

        {/* ชื่อวิชา */}
        <h3 className="text-base font-bold text-ink-900 leading-snug group-hover:text-tu-red-700 transition-colors">
          {course.subject}
        </h3>

        {/* สถิติ 2 คอลัมน์ */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="flex items-center gap-1.5 rounded-xl bg-paper-50 p-2">
            <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded bg-tu-red-50 text-tu-red-600">
              <CalendarDays className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold text-ink-400 uppercase tracking-tight">มีแบบทดสอบ</p>
              <p className="text-xs font-bold text-ink-800 whitespace-nowrap">{course.quiz_count} สัปดาห์</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-paper-50 p-2">
            <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded bg-amber-50 text-amber-600">
              <Users className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold text-ink-400 uppercase tracking-tight">นักศึกษาที่ส่งแล้ว</p>
              <p className="text-xs font-bold text-ink-800 whitespace-nowrap">
                {studentCount === null ? "…" : `${studentCount} คน`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ปุ่มดูรายงาน */}
      <div className="mt-5">
        <Link
          href={`/report/${course.course_id}`}
          className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-tu-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-tu-red-700 active:scale-95"
        >
          <span>ดูรายงาน</span>
        </Link>
      </div>
    </div>
  );
}
