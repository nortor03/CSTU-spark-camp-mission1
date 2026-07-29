"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import { buildClassReport, LEVEL_META, levelOf, type Submission } from "@/lib/analytics";
import { generateMockSubmissions } from "@/lib/mockClass";
import { buildCloMastery } from "@/components/student/CloRadar";
import { weekNumber } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonKpiSection } from "@/components/ui/Skeleton";
import MasteryBar, { MasteryLegend } from "@/components/ui/MasteryBar";
import SynthesisNotes from "@/components/teacher/report/class-report/SynthesisNotes";
import SkillClusters from "@/components/teacher/report/class-report/SkillClusters";
import SubmissionsTable from "@/components/teacher/report/class-report/SubmissionsTable";
import { ChevronDown, Check, CalendarDays } from "lucide-react";

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
        { id: "1", studentId: "6600123", studentName: "Marcus Sterling", score: 0, total: 10, percent: 100, isCurrentUser: false, week } as Submission,
        { id: "2", studentId: "6600456", studentName: "Lena Johansson", score: 0, total: 10, percent: 0, isCurrentUser: false, week } as Submission,
        { id: "3", studentId: "6600789", studentName: "David Chen", score: 0, total: 10, percent: 100, isCurrentUser: false, week } as Submission,
        { id: "4", studentId: "6600000", studentName: "Amara Williams", score: 0, total: 10, percent: 100, isCurrentUser: false, week } as Submission,
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

  // ผลลัพธ์การเรียนรู้ (CLO) ของทั้งห้อง — คำนวณจาก CLO จริงของวิชา (course.clos)
  // + คำตอบจริงของทุกคนที่ส่ง เหมือนวิธีที่ใช้ในหน้าสรุปภาพรวมฝั่งนักเรียน
  const cloMastery = useMemo(() => {
    if (!quiz || !course?.clos?.length || allSubmissions.length === 0) return [];
    return buildCloMastery(
      allSubmissions.map(() => quiz),
      allSubmissions.map((s) => s.answers),
      course.clos,
    );
  }, [quiz, course, allSubmissions]);

  // แบ่ง 3 กลุ่มระดับความสำเร็จของห้อง ตามเกณฑ์เดียวกับฝั่งนักเรียน (levelOf)
  const classClusters = useMemo(() => {
    const total = allSubmissions.length;
    if (total === 0) {
      return [
        { key: "1", label: "ทำได้ดีเยี่ยม", percent: 0, desc: "ยังไม่มีข้อมูลผลสอบ" },
        { key: "2", label: "ตามเกณฑ์", percent: 0, desc: "ยังไม่มีข้อมูลผลสอบ" },
        { key: "3", label: "ต้องการความช่วยเหลือ", percent: 0, desc: "ยังไม่มีข้อมูลผลสอบ" },
      ];
    }
    const strong = allSubmissions.filter((s) => levelOf(s.percent) === "strong").length;
    const weak = allSubmissions.filter((s) => levelOf(s.percent) === "weak").length;
    const medium = total - strong - weak;
    const sortedClo = [...cloMastery].sort((a, b) => b.percent - a.percent);
    const bestClo = sortedClo[0];
    const worstClo = sortedClo[sortedClo.length - 1];
    return [
      {
        key: "1",
        label: "ทำได้ดีเยี่ยม",
        percent: Math.round((strong / total) * 100),
        desc: bestClo ? `มีความเข้าใจอย่างดีใน ${bestClo.code}` : "มีความเข้าใจอย่างดีในหลายหัวข้อ",
      },
      {
        key: "2",
        label: "ตามเกณฑ์",
        percent: Math.round((medium / total) * 100),
        desc: "ผลการเรียนรู้ผ่านเกณฑ์อย่างสม่ำเสมอ",
      },
      {
        key: "3",
        label: "ต้องการความช่วยเหลือ",
        percent: Math.round((weak / total) * 100),
        desc: worstClo ? `ยังมีจุดอ่อนใน ${worstClo.code}` : "ยังมีจุดอ่อนในบางหัวข้อ",
      },
    ];
  }, [allSubmissions, cloMastery]);

  if (!hydrated) {
    return <SkeletonKpiSection />;
  }

  if (!report || !course) return (
    <div className="p-8 text-center text-ink-500">
      ไม่พบข้อมูลรายวิชา หรือยังไม่มีการประเมินผล
    </div>
  );

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
            รายงานรายสัปดาห์
          </h1>
          <p className="mt-1.5 text-base font-medium text-ink-500">
            การวิเคราะห์{report.week}: สรุปผลและข้อมูลเชิงลึก
          </p>
        </div>

        <div className="flex flex-col items-end gap-2.5">
          <div className="inline-flex flex-shrink-0 items-center gap-1 self-start rounded-xl bg-paper-100 p-1">
            <Link
              href={`/report/${courseId}`}
              replace
              className="rounded-lg px-4 py-2 text-sm font-bold text-ink-500 transition hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-tu-red-300"
            >
              ภาพรวม
            </Link>
            <button
              type="button"
              className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-tu-red-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tu-red-300"
            >
              รายสัปดาห์
            </button>
          </div>

          <WeekDropdown
            currentWeek={weekNumber(week)}
            weeks={Array.from(
              new Set(
                [
                  ...Object.keys(course.quizzes),
                  ...(course.topics.map((t) => t.weekAssigned).filter(Boolean) as string[]),
                  week,
                ].map(weekNumber),
              ),
            )
              .filter(Boolean)
              .sort((a, b) => Number(a) - Number(b))}
            onSelect={(w) => router.replace(`/report/${courseId}/${w}`)}
          />
        </div>
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

      <div
        className={`mb-6 grid gap-6 items-start ${quiz ? "lg:grid-cols-2" : ""}`}
      >
        <SynthesisNotes 
          insights={[
            {
              id: "1",
              topic: "Typography",
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
              topic: "Color",
              type: "strength",
              headline: "Color Theory",
              description: "มีความเข้าใจเรื่องการประยุกต์ใช้ทฤษฎีสีเป็นอย่างดี (อิงจาก 85% ของบันทึกสรุปที่ระบุว่านำไปใช้ได้จริง)",
              studentCount: 35,
              evidence: []
            },
            {
              id: "3",
              topic: "Micro-interactions",
              type: "suggestion",
              headline: "Micro-interactions",
              description: "เริ่มมีความสนใจเรื่อง Micro-interactions เพิ่มขึ้น (มีการพูดถึงใน Summary Note 22 ครั้ง)",
              studentCount: 22,
              evidence: []
            },
            {
              id: "4",
              topic: "Grid",
              type: "friction",
              headline: "Alignment and Grid",
              description: "เริ่มมีการนำระบบ Grid และ Alignment มาใช้ในงานออกแบบ แต่ยังขาดความแม่นยำในบางจุด",
              studentCount: 15,
              evidence: []
            }
          ]}
        />
        {quiz && (
        <SkillClusters
          isQuizAssigned={!!quiz}
          cloData={{
            radarAxes: cloMastery.map((c) => ({
              topic: `${c.code}: ${c.description}`,
              percent: c.percent,
            })),
            clusters: classClusters,
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
        )}
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

/** Custom Dropdown สำหรับเลือกสัปดาห์ (Cardless, Custom Styled) */
function WeekDropdown({
  currentWeek,
  weeks,
  onSelect,
}: {
  currentWeek: string;
  weeks: string[];
  onSelect: (week: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative self-end" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex min-w-[150px] items-center justify-between gap-2 rounded-xl border border-line bg-white py-2 pl-3.5 pr-2.5 text-sm shadow-sm transition-all hover:border-line-strong hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-tu-red-500/15"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 flex-shrink-0 text-tu-red-500" />
          <span className="truncate font-bold text-ink-900">สัปดาห์ที่ {currentWeek}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-ink-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-52 origin-top-left animate-scale-in rounded-xl border border-line bg-white p-1.5 shadow-xl">
          {weeks.map((w) => {
            const isSelected = w === currentWeek;
            return (
              <button
                key={w}
                onClick={() => {
                  onSelect(w);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-tu-red-50 text-tu-red-600 shadow-sm"
                    : "text-ink-600 hover:bg-paper-50 hover:text-ink-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className={`h-4 w-4 ${isSelected ? "text-tu-red-500" : "text-ink-400"}`} />
                  <span>สัปดาห์ที่ {w}</span>
                </div>
                {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
