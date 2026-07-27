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
    if (!course) return [];
    if (!quiz) {
      return [
        { id: "1", studentId: "6600123", studentName: "Marcus Sterling", score: 0, total: 10, percent: 100, isCurrentUser: false, week },
        { id: "2", studentId: "6600456", studentName: "Lena Johansson", score: 0, total: 10, percent: 0, isCurrentUser: false, week },
        { id: "3", studentId: "6600789", studentName: "David Chen", score: 0, total: 10, percent: 100, isCurrentUser: false, week },
        { id: "4", studentId: "6600000", studentName: "Amara Williams", score: 0, total: 10, percent: 100, isCurrentUser: false, week },
      ];
    }
    const real = course.submissions.filter((s) => s.week === week);
    return [...generateMockSubmissions(quiz), ...real];
  }, [quiz, course, week]);

  const report = useMemo(() => {
    if (quiz) return buildClassReport(quiz, allSubmissions);
    return {
      week: week,
      studentCount: 42,
      average: 0,
      median: 0,
      passRate: 0,
      topics: [],
      insights: [],
      distribution: [],
    };
  }, [quiz, allSubmissions, week]);

  if (!hydrated) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  if (!report) return null;

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
          <h1 className="display text-3xl font-bold tracking-tight text-ink-900 sm:text-[32px]">
            ภาพรวมนักศึกษา
          </h1>
          <p className="mt-1.5 text-base font-medium text-ink-500">
            การวิเคราะห์{report.week}: สรุปผลและข้อมูลเชิงลึก
          </p>
        </div>

        <label className="relative flex items-center gap-2 self-start rounded-xl border border-line bg-white pl-4 pr-1 shadow-sm transition focus-within:border-tu-red-400 focus-within:ring-2 focus-within:ring-tu-red-500/20 hover:border-line-strong">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-400">
            สัปดาห์
          </span>
          <select
            value={weekNumber(week)}
            onChange={(e) => {
              router.push(`/report/${courseId}/${e.target.value}`);
            }}
            className="cursor-pointer appearance-none bg-transparent py-2.5 pr-9 text-sm font-bold text-ink-900 focus:outline-none"
          >
            {Array.from(
              new Set([
                ...Object.keys(course.quizzes),
                ...(course.topics.map((t) => t.weekAssigned).filter(Boolean) as string[]),
                "Week 4",
              ])
            )
              .sort()
              .map((w) => (
                <option key={w} value={weekNumber(w)}>
                  สัปดาห์ที่ {weekNumber(w)}
                </option>
              ))}
          </select>
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </label>
      </div>

      {/* ---------- ตัวเลขสำคัญ ---------- */}
      {quiz && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="ผู้ส่งคำตอบ" value={report.studentCount} unit="คน" />
          <Kpi label="คะแนนเฉลี่ย" value={report.average} unit="%" />
          <Kpi label="มัธยฐาน" value={report.median} unit="%" />
          <Kpi label="ผ่านเกณฑ์ 50%" value={report.passRate} unit="%" />
        </div>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2 items-start">
        <SynthesisNotes 
          insights={[
            {
              id: "1",
              type: "friction",
              headline: "Typography Hierarchy",
              description: "นักศึกษาส่วนใหญ่ยังสับสนเรื่องลำดับชั้นของตัวอักษร (Typography Hierarchy) และการปรับขนาดแบบ Responsive โดย 64% ของบันทึกสรุป (Summary Note) ระบุว่ามีปัญหาในการเลือกจับคู่ฟอนต์",
              studentCount: 26,
              evidence: [
                { studentId: "6600123", studentName: "สมชาย แซ่ตั้ง", detail: "ผมยังไม่ค่อยเข้าใจว่าตอนทำ Responsive ต้องปรับขนาดฟอนต์ให้ลดหลั่นกันยังไงครับ" },
                { studentId: "6600456", studentName: "มาลี ดีใจ", detail: "จับคู่ฟอนต์ยากมากค่ะ ไม่รู้ว่า Heading กับ Body ควรใช้ฟอนต์อะไรคู่กันถึงจะสวย" }
              ]
            },
            {
              id: "2",
              type: "strength",
              headline: "Color Theory",
              description: "มีความเข้าใจเรื่องการประยุกต์ใช้ทฤษฎีสีเป็นอย่างดี (อิงจาก 85% ของบันทึกสรุปที่ระบุว่านำไปใช้ได้จริง)",
              studentCount: 35,
              evidence: []
            },
            {
              id: "3",
              type: "suggestion",
              headline: "Micro-interactions",
              description: "เริ่มมีความสนใจเรื่อง Micro-interactions เพิ่มขึ้น (มีการพูดถึงใน Summary Note 22 ครั้ง)",
              studentCount: 22,
              evidence: []
            },
            {
              id: "4",
              type: "friction",
              headline: "Alignment and Grid",
              description: "เริ่มมีการนำระบบ Grid และ Alignment มาใช้ในงานออกแบบ แต่ยังขาดความแม่นยำในบางจุด",
              studentCount: 15,
              evidence: []
            }
          ]} 
        />
        <SkillClusters 
          isQuizAssigned={!!quiz}
          cloData={{
            radarAxes: [
              { topic: "CLO 1: พื้นฐาน", percent: 85 },
              { topic: "CLO 2: ปฏิบัติ", percent: 70 },
              { topic: "CLO 3: วิเคราะห์", percent: 45 },
              { topic: "CLO 4: จริยธรรม", percent: 75 }
            ],
            clusters: [
              { key: "1", label: "ทำได้ดีเยี่ยม", percent: 18, desc: "มีความเข้าใจอย่างดีใน CLO 1 และ 2" },
              { key: "2", label: "ตามเกณฑ์", percent: 64, desc: "ผลการเรียนรู้ผ่านเกณฑ์อย่างสม่ำเสมอ" },
              { key: "3", label: "ต้องการความช่วยเหลือ", percent: 18, desc: "ยังมีจุดอ่อนใน CLO 3: วิเคราะห์" }
            ]
          }}
          secondaryData={
            !!quiz
              ? {
                  radarAxes: report.topics.map(t => ({ topic: t.topic, percent: t.percent })),
                  clusters: [
                    { key: "1", label: "กลุ่มแม่นยำสูง", percent: 30, desc: "เข้าใจเนื้อหาควิซได้ครอบคลุม" },
                    { key: "2", label: "กลุ่มระดับกลาง", percent: 50, desc: "ทำได้ดีในหัวข้อทั่วไป แต่ยังพลาดข้อยาก" },
                    { key: "3", label: "กลุ่มต้องทบทวน", percent: 20, desc: "ยังมีปัญหาในหลายหัวข้อหลัก" }
                  ]
                }
              : {
                  radarAxes: [
                    { topic: "คิดวิเคราะห์ (Critical Thinking)", percent: 80 },
                    { topic: "สะท้อนตนเอง (Self-Reflection)", percent: 65 },
                    { topic: "เชื่อมโยงเนื้อหา (Content Connection)", percent: 75 },
                    { topic: "ระบุปัญหา (Problem Identification)", percent: 50 },
                  ],
                  clusters: [
                    { key: "1", label: "วิเคราะห์เชิงลึก", percent: 30, desc: "สามารถเชื่อมโยงทฤษฎีเข้ากับปัญหาที่เจอได้ดีมาก" },
                    { key: "2", label: "เข้าใจระดับพื้นฐาน", percent: 50, desc: "สรุปเนื้อหาได้ครบ แต่ยังขาดการสะท้อนมุมมองส่วนตัว" },
                    { key: "3", label: "ต้องการคำแนะนำ", percent: 20, desc: "บันทึกสรุปสั้นเกินไป หรือระบุว่าตามไม่ทันหลายหัวข้อ" }
                  ]
                }
          }
        />
      </div>



      <div className="mb-6">
        <SubmissionsTable 
          submissions={allSubmissions}
          weekLabel={report.week}
          week={week}
          courseId={courseId}
          courseSubject={course.subject}
          isQuizAssigned={!!quiz}
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
