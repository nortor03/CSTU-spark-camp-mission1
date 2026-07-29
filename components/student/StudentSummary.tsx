"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import { generateMockSubmissions } from "@/lib/mockClass";
import {
  buildStudentSummary,
  levelOf,
  LEVEL_META,
  type MasteryLevel,
  type Submission,
  type StudentSummary as StudentSummaryData,
} from "@/lib/analytics";
import { weekNumber } from "@/lib/weeks";
import { getPracticeHistory, type PracticeAttempt } from "@/lib/practiceHistory";
import MasteryBar, { MasteryLegend } from "@/components/ui/MasteryBar";
import {
  ChevronDown,
  Check,
  CalendarDays,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  Sparkles,
  CheckCircle2,
  Zap,
  ArrowRight,
} from "lucide-react";
import ImprovementChart from "./ImprovementChart";
import CloRadar, { buildCloMastery } from "./CloRadar";

/* ─── Design tokens ─── */
const LEVEL_CHIP: Record<MasteryLevel, string> = {
  strong: "bg-emerald-50 text-[#047857] ring-1 ring-emerald-200/70",
  medium: "bg-tu-gold-50 text-tu-gold-700 ring-1 ring-tu-gold-200/70",
  weak: "bg-tu-red-50 text-tu-red-700 ring-1 ring-tu-red-100",
};

/** คู่สีไล่เฉดในตระกูลเดียวกันของวงแหวนคะแนน (ตามระดับ) */
const RING_GRADIENT: Record<MasteryLevel, [string, string]> = {
  strong: ["#059669", "#047857"],
  medium: ["#F2A900", "#C4870B"],
  weak: ["#DC5462", "#C8102E"],
};

const RING_GLOW: Record<MasteryLevel, string> = {
  strong: "rgba(4,120,87,0.28)",
  medium: "rgba(196,135,11,0.28)",
  weak: "rgba(200,16,46,0.28)",
};

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ─── Count-up: ตัวเลขวิ่งจาก 0 → ค่าจริง ─── */
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}

/* ─── Reveal: ค่อย ๆ เผยเมื่อเลื่อนถึง (ของจริง — ไม่พึ่ง plugin) ─── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

/* ─── ScoreRing ─── */
function ScoreRing({
  percent,
  size = 170,
  strokeWidth = 11,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const level = levelOf(percent);
  const shown = useCountUp(percent, 1100);
  const offset = circumference - (shown / 100) * circumference;

  const gradientId = "score-ring-grad";
  const [from, to] = RING_GRADIENT[level];

  // ขีดวัดบาง ๆ รอบวง — ให้ความรู้สึกเครื่องมือวัด
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 24;
    const outer = radius - strokeWidth / 2 - 5;
    const inner = outer - (i % 6 === 0 ? 8 : 4);
    return {
      x1: size / 2 + Math.cos(a) * outer,
      y1: size / 2 + Math.sin(a) * outer,
      x2: size / 2 + Math.cos(a) * inner,
      y2: size / 2 + Math.sin(a) * inner,
      major: i % 6 === 0,
    };
  });

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 transform">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>

        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="#D6C8B4"
            strokeWidth={t.major ? 1.5 : 1}
            opacity={t.major ? 0.7 : 0.4}
          />
        ))}

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-current text-paper-200/80"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{ filter: `drop-shadow(0 2px 6px ${RING_GLOW[level]})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[44px] font-black leading-none tabular-nums tracking-tight text-ink-900">
          {shown}
          <span className="ml-0.5 text-xl font-bold text-ink-300">%</span>
        </span>
        <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">
          คะแนนรวม
        </span>
      </div>
    </div>
  );
}

/* ─── Dropdown: เลือกสัปดาห์ ─── */
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
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayCurrent = currentWeek.startsWith("สัปดาห์ที่")
    ? currentWeek
    : `สัปดาห์ที่ ${currentWeek}`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex min-w-[150px] items-center justify-between gap-2 rounded-xl border border-line bg-white py-2 pl-3.5 pr-2.5 text-sm shadow-sm transition-all hover:border-line-strong hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-tu-red-500/15"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 flex-shrink-0 text-tu-red-500" />
          <span className="truncate font-bold text-ink-900">{displayCurrent}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-ink-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 origin-top-right animate-scale-in rounded-xl border border-line bg-white p-1.5 shadow-xl">
          {weeks.map((w) => {
            const isSelected = w === currentWeek;
            const displayW = w.startsWith("สัปดาห์ที่") ? w : `สัปดาห์ที่ ${w}`;
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
                  <CalendarDays
                    className={`h-4 w-4 ${isSelected ? "text-tu-red-500" : "text-ink-400"}`}
                  />
                  <span>{displayW}</span>
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

/* ─── ตัวเลือกรอบฝึกซ้อม — ปุ่มกะทัดรัด กดแล้วเปิด popover เลือกรอบ (โผล่เฉพาะมี ≥2 รอบ) ─── */
function RoundPicker({
  activeRound,
  attemptResults,
  onSelectRound,
}: {
  activeRound: string;
  attemptResults: { attempt: PracticeAttempt; result: StudentSummaryData }[];
  onSelectRound: (round: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedIndex = attemptResults.findIndex((a) => a.attempt.id === activeRound);
  const selected = selectedIndex >= 0 ? attemptResults[selectedIndex] : undefined;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 rounded-full bg-paper-100 px-3 py-1.5 text-xs font-bold text-ink-700 transition hover:bg-paper-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-tu-red-300"
      >
        <History className="h-3.5 w-3.5 text-ink-400" />
        รอบ {selectedIndex + 1}
        {selected && (
          <span className="tabular-nums text-tu-red-600">· {selected.result.percent}%</span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right animate-scale-in overflow-hidden rounded-xl border border-line bg-white shadow-xl">
          {attemptResults.map((item, i) => {
            const isSelected = activeRound === item.attempt.id;
            return (
              <button
                type="button"
                key={item.attempt.id}
                onClick={() => {
                  onSelectRound(item.attempt.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2.5 text-left text-sm transition-colors last:border-0 ${
                  isSelected ? "bg-tu-red-50" : "hover:bg-paper-50"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink-800">รอบ {i + 1}</p>
                  <p className="text-[11px] text-ink-400">{fmtDate(item.attempt.at)}</p>
                </div>
                <span
                  className="flex-shrink-0 text-sm font-extrabold tabular-nums"
                  style={{
                    color:
                      item.result.percent >= 80
                        ? "#047857"
                        : item.result.percent >= 50
                          ? "#986600"
                          : "#C8102E",
                  }}
                >
                  {item.result.percent}%
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export default function StudentSummary({ week }: { week: string }) {
  const router = useRouter();
  const { getQuiz, getCourse, submissions, studentId, activeCourseId, hydrated } =
    useCourse();

  const quiz = getQuiz(week);
  const course = getCourse(activeCourseId ?? "");
  const wk = weekNumber(week);

  // อาจารย์เปิดดูสรุปของนักศึกษาคนหนึ่ง (จากตารางในหน้ารายงาน) — ส่ง ?student=<id> มา
  const searchParams = useSearchParams();
  const viewStudentId = searchParams.get("student");
  const isTeacherView = !!viewStudentId;

  const [activeRound, setActiveRound] = useState<string>("official");

  // ประวัติการฝึกซ้อมจริง (เก็บแยกใน localStorage ต่อสัปดาห์ — ไม่ใช่ผลทางการ)
  // มุมมองอาจารย์ = ดูเฉพาะผลสอบจริง ไม่มีรอบฝึกซ้อม (ของนักศึกษาแต่ละคน)
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  useEffect(() => {
    if (isTeacherView || !hydrated) {
      setAttempts([]);
      return;
    }
    setAttempts(getPracticeHistory(studentId, activeCourseId, week));
  }, [isTeacherView, hydrated, studentId, activeCourseId, week]);

  // แต่ละรอบฝึกซ้อมมีชุดคำถามของตัวเอง — ตรวจด้วยควิซของรอบนั้น ไม่ใช่ควิซทางการ
  const attemptResults = useMemo(
    () =>
      attempts.map((a) => ({
        attempt: a,
        result: buildStudentSummary(a.quiz, a.answers),
      })),
    [attempts],
  );

  const weeksAvailable = useMemo(() => {
    if (!course) return [];
    return Array.from(new Set(Object.keys(course.quizzes)))
      .filter(Boolean)
      .sort((a, b) => Number(weekNumber(a)) - Number(weekNumber(b)));
  }, [course]);

  // พัฒนาการระหว่างรอบฝึกซ้อม (รอบแรก → รอบล่าสุด)
  const delta =
    attemptResults.length >= 2
      ? attemptResults[attemptResults.length - 1].result.percent -
        attemptResults[0].result.percent
      : null;

  const officialMine = isTeacherView
    ? quiz
      ? generateMockSubmissions(quiz).find((s) => s.studentId === viewStudentId)
      : undefined
    : submissions
        .filter((s) => s.week === week && s.isCurrentUser)
        .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))[0];

  const officialSummary =
    officialMine && quiz ? buildStudentSummary(quiz, officialMine.answers) : null;

  const mine =
    activeRound === "official" ? officialMine : attempts.find((a) => a.id === activeRound);
  const summary =
    activeRound === "official"
      ? officialSummary
      : attemptResults.find((a) => a.attempt.id === activeRound)?.result;
  // ผลสอบจริงมี submittedAt / รอบฝึกซ้อมมี at — รวมเป็นตัวเดียวให้ใช้แสดงผลง่าย ๆ
  const mineDate = activeRound === "official" ? officialMine?.submittedAt : mine && "at" in mine ? mine.at : undefined;
  // ควิซที่ใช้คู่กับคำตอบของรอบที่กำลังดู (ทางการ = ควิซทางการ, ฝึกซ้อม = ควิซของรอบนั้นเอง)
  const activeQuiz =
    activeRound === "official" ? quiz : attemptResults.find((a) => a.attempt.id === activeRound)?.attempt.quiz;

  // hooks ต้องเรียกด้วยลำดับเดิมทุกครั้ง — วางก่อน early return ทุกจุด
  const officialScoreShown = useCountUp(officialSummary?.score ?? 0);
  const strongShown = useCountUp(summary?.strong.length ?? 0);
  const weakShown = useCountUp(summary?.weak.length ?? 0);

  if (!hydrated) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">กำลังโหลด…</div>
    );
  }

  if (!quiz || !officialMine || !officialSummary) {
    return (
      <div className="card-empty">
        <h2 className="display text-lg">ยังไม่มีผลของ {week}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
          ต้องทำแบบทดสอบของสัปดาห์นี้ก่อน ระบบจึงจะสรุปจุดแข็งและจุดอ่อนให้ได้
        </p>
        <Link href="/student" className="btn-primary mt-5">
          ไปเลือกแบบทดสอบ
        </Link>
      </div>
    );
  }

  if (!mine || !summary) return null;

  const strongest = summary.topics[0];
  const weakest = summary.topics[summary.topics.length - 1];
  const hasWeak = weakest && weakest.level !== "strong";
  const level = levelOf(summary.percent);

  const selectedAttemptIndex =
    activeRound === "official" ? -1 : attemptResults.findIndex((a) => a.attempt.id === activeRound);
  const visibleAttemptResults =
    activeRound === "official" ? [] : attemptResults.slice(0, selectedAttemptIndex + 1);

  const chartScores = [officialSummary.percent, ...visibleAttemptResults.map((r) => r.result.percent)];
  const chartLabels = ["ข้อสอบจากอาจารย์", ...visibleAttemptResults.map((_, i) => `รอบ ${i + 1}`)];

  return (
    <div className="relative space-y-10">

      {/* ─── Breadcrumb ─── */}
      <div className="text-sm font-medium text-ink-400">
        <Link href="/student" className="transition-colors hover:text-tu-red-600">
          รายวิชาเรียน
        </Link>
        {course && (
          <>
            <span className="mx-2 text-ink-300">/</span>
            <Link
              href={`/student/course/${course.id}`}
              className="transition-colors hover:text-tu-red-600"
            >
              {course.subject}
            </Link>
            <span className="mx-2 text-ink-300">/</span>
            <Link
              href={`/student/summary/course/${course.id}`}
              className="transition-colors hover:text-tu-red-600"
            >
              วิเคราะห์ผลการเรียนรู้
            </Link>
          </>
        )}
      </div>

      {/* ─── Header + Action Bar ─── */}
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">
              {isTeacherView ? "รายงานรายบุคคล" : "Learning Analytics"} · สัปดาห์ที่{" "}
              {wk}
            </p>
            <h1
              className={`display mt-1.5 text-2xl sm:text-3xl md:text-[34px] ${
                isTeacherView ? "" : "whitespace-nowrap"
              }`}
            >
              {isTeacherView
                ? `วิเคราะห์ผลการเรียนรู้ของ ${officialMine.studentName}`
                : "วิเคราะห์ผลการเรียนรู้ของคุณ"}
            </h1>
            <hr className="rule-gold my-3" />
            <p className="max-w-lg text-sm leading-relaxed text-ink-500">{summary.headline}</p>
          </div>

          <div className="flex flex-col items-end gap-2.5">
            {/* สลับภาพรวม/รายสัปดาห์ — เหมือนหน้าภาพรวมทั้งวิชา (เฉพาะมุมมองนักศึกษาเจ้าของ) */}
            {!isTeacherView && course && (
              <div className="inline-flex items-center gap-1 rounded-xl bg-paper-100 p-1">
                <Link
                  href={`/student/summary/course/${course.id}`}
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
            )}

            {/* 1) เลือกสัปดาห์ก่อน */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {weeksAvailable.length > 0 && (
              <WeekDropdown
                currentWeek={week}
                weeks={weeksAvailable}
                onSelect={(w) =>
                  router.push(
                    `/student/summary/${weekNumber(w)}${
                      isTeacherView
                        ? `?student=${encodeURIComponent(viewStudentId!)}`
                        : ""
                    }`,
                  )
                }
              />
            )}
          </div>

            {/* 2) จากนั้นค่อยเลือกแหล่งข้อมูลของสัปดาห์นี้ — โชว์เฉพาะเมื่อมีทั้งสองแหล่ง */}
            {!isTeacherView && attemptResults.length > 0 && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-400">แสดงผลจาก</span>
                  <div className="inline-flex items-center gap-1 rounded-xl bg-paper-100 p-1">
                    <button
                      type="button"
                      onClick={() => setActiveRound("official")}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tu-red-300 ${
                        activeRound === "official"
                          ? "bg-white text-tu-red-700 shadow-sm"
                          : "text-ink-500 hover:text-ink-700"
                      }`}
                    >
                      ข้อสอบอาจารย์
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveRound(
                          attemptResults[attemptResults.length - 1].attempt.id,
                        )
                      }
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tu-red-300 ${
                        activeRound !== "official"
                          ? "bg-white text-tu-red-700 shadow-sm"
                          : "text-ink-500 hover:text-ink-700"
                      }`}
                    >
                      ฝึกซ้อม
                    </button>
                  </div>
                </div>

                {/* บอกว่ากำลังดูรอบไหนอยู่ — โผล่ตลอดตอนดูฝึกซ้อม แม้มีรอบเดียว */}
                {activeRound !== "official" && (
                  <RoundPicker
                    activeRound={activeRound}
                    attemptResults={attemptResults}
                    onSelectRound={setActiveRound}
                  />
                )}
              </div>
            )}

            {/* 3) เลือกครบแล้วค่อยสร้างข้อสอบฝึกซ้อม = เฉพาะมุมมองนักศึกษาเจ้าของ (ไม่โชว์ให้อาจารย์) */}
            {!isTeacherView && (
              <Link
                href={`/student/quiz/${week.match(/\d+/)?.[0] ?? ""}?practice=1`}
                className="group flex items-center gap-2 rounded-xl border border-tu-gold-200 bg-gradient-to-r from-tu-gold-50 to-amber-50 px-4 py-2 text-sm font-bold text-tu-gold-700 shadow-sm transition-all hover:from-tu-gold-100 hover:to-amber-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-tu-gold-500/15"
              >
                <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                <span>สร้างข้อสอบฝึกซ้อมด้วย AI</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>

        {/* ─── KPI inline stats ─── */}
        <Reveal delay={40}>
          <div className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-4 border-b border-line-soft pb-7">
            <div className="group">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
                คะแนนสอบจริง
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-ink-900">
                {officialScoreShown}
                <span className="ml-1 text-base font-semibold text-ink-300">
                  / {officialSummary.total} ข้อ
                </span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
                เข้าใจดี (≥80%)
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-[#047857]">
                {strongShown}
                <span className="ml-1 text-base font-semibold text-ink-300">หัวข้อ</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
                ควรทบทวน (&lt;50%)
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-tu-red-600">
                {weakShown}
                <span className="ml-1 text-base font-semibold text-ink-300">หัวข้อ</span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ─── Hero: Score Ring + Skill Radar ─── */}
      <Reveal>
        <section className="flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-16">
          {/* Left: Score Ring */}
          <div className="flex flex-col items-center md:w-2/5">
            <span className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-400">
              <span
                className={`h-2 w-2 rounded-full ${
                  activeRound === "official" ? "bg-tu-gold-500" : "animate-pulse bg-tu-red-500"
                }`}
              />
              {activeRound === "official"
                ? "ข้อสอบจากอาจารย์"
                : `ฝึกซ้อมรอบที่ ${selectedIndexLabel(attemptResults, activeRound)}`}
            </span>

            <ScoreRing percent={summary.percent} size={190} strokeWidth={12} />

            <p className="mt-5 text-sm text-ink-500">
              ตอบถูก <strong className="font-extrabold text-ink-900">{summary.score}</strong> จาก{" "}
              {summary.total} ข้อ
            </p>
            <p className="mt-1 text-xs text-ink-400">ส่งเมื่อ {fmtDate(mineDate ?? "")}</p>
            <span
              className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-transform duration-200 hover:scale-105 ${LEVEL_CHIP[level]}`}
            >
              <span aria-hidden>{LEVEL_META[level].icon}</span>
              {LEVEL_META[level].label}
            </span>
          </div>

          {/* Right: CLO Radar (รายหัวข้อดูได้ที่ส่วน "ความเข้าใจรายหัวข้อ" ด้านล่างแทน) */}
          <div className="flex-1 md:w-3/5">
            {(() => {
              const cloData = course?.clos?.length && activeQuiz && mine
                ? buildCloMastery([activeQuiz], [mine.answers], course.clos)
                : [];
              return (
                <div>
                  <div className="mb-2">
                    <h3 className="display text-lg">ผลลัพธ์การเรียนรู้ (CLO)</h3>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {activeRound === "official"
                        ? "วัดจากคะแนนสอบจริงจากอาจารย์"
                        : "วัดจากคะแนนการฝึกซ้อมด้วยตนเอง"}
                    </p>
                  </div>
                  {cloData.length === 0 ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-paper-50/60 px-6 py-10 text-center">
                      <p className="max-w-[26ch] text-xs leading-relaxed text-ink-400">
                        ข้อสอบวิชานี้ยังไม่ได้ระบุ CLO ที่เกี่ยวข้อง — เมื่ออาจารย์ผูก CLO กับคำถามแล้ว กราฟจะแสดงที่นี่
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center">
                        <CloRadar clos={cloData} />
                      </div>
                      {/* Legend */}
                      <div className="mt-3 divide-y divide-line-soft rounded-xl border border-line-soft bg-paper-50/60 px-4 py-2">
                        {cloData.map((c) => (
                          <div key={c.code} className="flex items-center justify-between gap-3 py-1.5">
                            <span className="text-[11px] font-bold text-ink-600">{c.code}</span>
                            <span className="min-w-0 flex-1 truncate text-[11px] text-ink-400">{c.description}</span>
                            <span className="flex-shrink-0 text-[11px] font-bold tabular-nums text-ink-800">{c.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </section>
      </Reveal>

      {/* ─── ประวัติการพัฒนา (เฉพาะรอบฝึกซ้อม) ─── */}
      {activeRound !== "official" && (
        <Reveal>
          <div className="border-t border-line-soft pt-10">
            <h2 className="display text-lg">ประวัติการพัฒนา</h2>
            <hr className="rule-gold mb-3 mt-2.5" />
            <p className="text-xs text-ink-400">เปรียบเทียบคะแนนระหว่างรอบ</p>
            <div className="mt-5">
              <ImprovementChart scores={chartScores} labels={chartLabels} />
              {visibleAttemptResults.length === 0 && (
                <p className="mt-2 text-center text-xs text-ink-400">
                  ยังมีแค่ผลสอบจริง — ลองเลือกดูผลการฝึกซ้อมรอบอื่นเพื่อดูพัฒนาการ
                </p>
              )}
            </div>
          </div>
        </Reveal>
      )}

      {/* ─── ความเข้าใจรายหัวข้อ + AI สรุปข้อสังเกต ─── */}
      <div className="border-t border-line-soft pt-10">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <section>
              <h2 className="display text-lg">ความเข้าใจรายหัวข้อ</h2>
              <hr className="rule-gold mb-5 mt-2.5" />
              <div className="divide-y divide-line-soft">
                {summary.topics.map((t) => (
                  <MasteryBar key={t.topic} item={t} />
                ))}
              </div>
              <div className="mt-4">
                <MasteryLegend />
              </div>
            </section>
          </Reveal>

          <Reveal delay={100}>
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="display text-lg">AI สรุปข้อสังเกต</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-tu-gold-50 px-3 py-1 text-[10px] font-bold text-tu-gold-700 ring-1 ring-tu-gold-200">
                  <Zap className="h-3 w-3" /> AI Insights
                </span>
              </div>
              <hr className="rule-gold mb-5" />

              <div className="space-y-4">
                {hasWeak ? (
                  <div className="rounded-xl border-l-[3px] border-tu-red-500 bg-tu-red-50/40 py-2.5 pl-4 pr-3 transition-colors hover:bg-tu-red-50/70">
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-tu-red-600">
                      <Target className="h-3.5 w-3.5" />
                      จุดที่ควรโฟกัสที่สุด
                    </p>
                    <p className="text-sm leading-relaxed text-ink-600">
                      เรื่อง <span className="font-bold text-ink-900">&ldquo;{weakest.topic}&rdquo;</span>{" "}
                      ยังเป็นจุดอ่อนที่สุด — ตอบถูก {weakest.correct}/{weakest.total} ข้อ (
                      {weakest.percent}%) ควรทบทวนเนื้อหานี้ก่อนเข้าสู่สัปดาห์ถัดไป
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border-l-[3px] border-emerald-500 bg-emerald-50/40 py-2.5 pl-4 pr-3 transition-colors hover:bg-emerald-50/70">
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-[#047857]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ทำได้เยี่ยมทุกหัวข้อ
                    </p>
                    <p className="text-sm leading-relaxed text-ink-600">
                      ไม่มีหัวข้อไหนต่ำกว่าเกณฑ์ — ลองอ่านเนื้อหาสัปดาห์ถัดไปล่วงหน้าได้เลย
                    </p>
                  </div>
                )}

                {strongest.level === "strong" && (
                  <div className="rounded-xl border-l-[3px] border-emerald-500 bg-emerald-50/40 py-2.5 pl-4 pr-3 transition-colors hover:bg-emerald-50/70">
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-[#047857]">
                      <TrendingUp className="h-3.5 w-3.5" />
                      จุดแข็งของคุณ
                    </p>
                    <p className="text-sm leading-relaxed text-ink-600">
                      เข้าใจเรื่อง{" "}
                      <span className="font-bold text-ink-900">&ldquo;{strongest.topic}&rdquo;</span>{" "}
                      ได้ดีที่สุด ({strongest.percent}%) —
                      ใช้ความเข้าใจนี้ช่วยต่อยอดหัวข้อที่ยังไม่แม่นได้
                    </p>
                  </div>
                )}

                {summary.topics
                  .filter((t) => t !== weakest && t !== strongest)
                  .map((t) => (
                    <div
                      key={t.topic}
                      className="flex items-start gap-3 rounded-lg px-1 py-0.5 transition-colors hover:bg-paper-100/60"
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                          t.level === "weak"
                            ? "bg-tu-red-500"
                            : t.level === "medium"
                              ? "bg-tu-gold-500"
                              : "bg-emerald-500"
                        }`}
                        aria-hidden
                      />
                      <p className="text-sm leading-relaxed text-ink-600">
                        <span className="font-semibold text-ink-800">
                          &ldquo;{t.topic}&rdquo;
                        </span>{" "}
                        อยู่ระดับ{LEVEL_META[t.level].label} ({t.percent}%)
                        {t.level === "medium"
                          ? " — ยังขยับเป็นเข้าใจดีได้อีก ลองอธิบายด้วยคำพูดตัวเองดู"
                          : t.level === "weak"
                            ? " — ควรกลับไปทบทวนแล้วทำแบบทดสอบซ้ำ"
                            : " — รักษาความเข้าใจนี้ไว้"}
                      </p>
                    </div>
                  ))}
              </div>
            </section>
          </Reveal>
        </div>
      </div>

      {/* ─── จุดที่ตอบผิด ─── */}
      {summary.misconceptions.length > 0 && (
        <Reveal>
          <div className="border-t border-line-soft pt-10">
            <div className="mb-2.5 flex items-center justify-between">
              <div>
                <h2 className="display text-lg">จุดที่ตอบผิดในรอบนี้</h2>
                <p className="mt-1 text-sm text-ink-500">เทียบคำตอบที่คุณเลือกกับคำตอบที่ถูก</p>
              </div>
              <span className="rounded-full bg-tu-red-50 px-3 py-1 text-xs font-bold tabular-nums text-tu-red-600 ring-1 ring-tu-red-100">
                ผิด {summary.misconceptions.length} ข้อ
              </span>
            </div>
            <hr className="rule-gold mb-6" />

            <div className="space-y-2">
              {summary.misconceptions.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-4 transition-colors hover:bg-paper-100/50 sm:px-5"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-tu-gold-600">
                    {m.topic}
                  </span>
                  <p className="mt-2 text-[15px] font-semibold leading-relaxed text-ink-900">
                    <span className="mr-1.5 font-black text-ink-300">{i + 1}.</span>
                    {m.question}
                  </p>
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:gap-10">
                    <div className="flex-1">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                        คุณตอบ
                      </p>
                      <p className="flex items-start gap-2 text-sm font-medium text-tu-red-600">
                        <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-tu-red-50 text-[10px] font-bold ring-1 ring-tu-red-100">
                          ✕
                        </span>
                        {m.chosenText}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                        คำตอบที่ถูก
                      </p>
                      <p className="flex items-start gap-2 text-sm font-medium text-[#047857]">
                        <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold ring-1 ring-emerald-200">
                          ✓
                        </span>
                        {m.correctText}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}

function selectedIndexLabel(
  attemptResults: { attempt: { id: string } }[],
  activeRound: string,
) {
  const idx = attemptResults.findIndex((a) => a.attempt.id === activeRound);
  return idx >= 0 ? idx + 1 : 1;
}
