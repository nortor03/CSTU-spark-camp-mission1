"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import { buildClassReport, LEVEL_META, type Submission } from "@/lib/analytics";
import { generateMockSubmissions } from "@/lib/mockClass";
import { weekNumber } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";
import MasteryBar, { MasteryLegend } from "@/components/ui/MasteryBar";
import SynthesisNotes from "@/components/teacher/report/class-report/SynthesisNotes";
import SkillClusters from "@/components/teacher/report/class-report/SkillClusters";
import SubmissionsTable from "@/components/teacher/report/class-report/SubmissionsTable";

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
  const router = useRouter();
  const course = getCourse(courseId);
  // ใช้ควิซ "ชุดที่ active" ของสัปดาห์นั้นในการสรุปผล (ถ้าไม่มี active ใช้ตัวแรก)
  const weekQuizzes = course?.quizzes[week];
  const quiz =
    weekQuizzes?.find((q) => q.isActive) ?? weekQuizzes?.[0];

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
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 text-sm font-medium text-ink-500">
            <Link href="/course" className="hover:text-tu-red-600">
              รายวิชาทั้งหมด
            </Link>
            <span className="mx-2 text-ink-300">›</span>
            <span className="text-ink-700">{course.subject}</span>
          </div>
          <h1 className="display text-3xl font-bold tracking-tight text-tu-blue-800 sm:text-[32px] text-ink-900">
            ภาพรวมนักศึกษา
          </h1>
          <p className="mt-1.5 text-base font-medium text-ink-500">
            การวิเคราะห์{report.week}: สรุปผลและข้อมูลเชิงลึก
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center rounded-xl border border-line-soft bg-paper-50 p-1 shadow-sm">
          {Object.keys(course.quizzes)
            .sort()
            .map((w) => {
              const isActive = w === week;
              return (
                <Link
                  key={w}
                  href={`/report/${courseId}/${weekNumber(w)}`}
                  className={`rounded-lg px-5 py-1.5 text-sm font-bold transition-all ${
                    isActive
                      ? "bg-white text-ink-900 shadow-sm"
                      : "text-ink-500 hover:text-ink-700"
                  }`}
                >
                  {w}
                </Link>
              );
            })}
        </div>
      </div>

      {/* ---------- ตัวเลขสำคัญ ---------- */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="ผู้ส่งคำตอบ" value={report.studentCount} unit="คน" />
        <Kpi label="คะแนนเฉลี่ย" value={report.average} unit="%" />
        <Kpi label="มัธยฐาน" value={report.median} unit="%" />
        <Kpi label="ผ่านเกณฑ์ 50%" value={report.passRate} unit="%" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2 items-start">
        <SynthesisNotes insights={report.insights} />
        <SkillClusters 
          radarAxes={report.topics} 
          clusters={[
            { key: "1", label: "Creative Thinkers", count: Math.ceil(report.studentCount * 0.3), weakTopic: "ความแม่นยำ" },
            { key: "2", label: "Technical Focus", count: Math.ceil(report.studentCount * 0.2), weakTopic: "ความคิดสร้างสรรค์" },
            { key: "3", label: "Needs Basics", count: Math.ceil(report.studentCount * 0.1), weakTopic: "พื้นฐาน" },
            { key: "4", label: "Advanced", count: Math.ceil(report.studentCount * 0.4), weakTopic: null }
          ]} 
        />
      </div>



      <div className="mb-6">
        <SubmissionsTable 
          submissions={allSubmissions}
          weekLabel={report.week}
          week={week}
          courseId={courseId}
          courseSubject={course.subject}
        />
      </div>
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
