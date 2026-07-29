"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useCourse } from "@/lib/courseStore";
import {
  buildStudentSummary,
  levelOf,
  LEVEL_META,
  type MasteryLevel,
  type TopicMastery,
  type Misconception,
} from "@/lib/analytics";
import { weekNumber } from "@/lib/weeks";
import {
  CalendarDays,
  Target,
  TrendingUp,
  Check,
  Layers,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import CloRadar, { buildCloMastery, type CloMastery } from "./CloRadar";
import ImprovementChart from "./ImprovementChart";
import type { Quiz } from "@/lib/quiz";
import type { StudentAnswers } from "@/lib/feedback";
import type { PracticeAttempt } from "@/lib/practiceHistory";
import {
  fetchPracticeQuizzes,
  fetchPracticeQuiz,
  fetchPracticeQuizSubmissions,
} from "@/lib/practiceQuizApi";


/* ─── Design tokens ─── */
const LEVEL_CHIP: Record<MasteryLevel, string> = {
  strong: "bg-emerald-50 text-[#047857] ring-1 ring-emerald-200/70",
  medium: "bg-tu-gold-50 text-tu-gold-700 ring-1 ring-tu-gold-200/70",
  weak: "bg-tu-red-50 text-tu-red-700 ring-1 ring-tu-red-100",
};

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

/* ─── Count-up ─── */
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVal(target); return; }
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ─── Reveal ─── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
      {children}
    </div>
  );
}

/* ─── ScoreRing ─── */
function ScoreRing({ percent, size = 170, strokeWidth = 11 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const level = levelOf(percent);
  const shown = useCountUp(percent, 1100);
  const offset = circumference - (shown / 100) * circumference;
  const gradientId = "overall-ring-grad";
  const [from, to] = RING_GRADIENT[level];
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 24;
    const outer = radius - strokeWidth / 2 - 5;
    const inner = outer - (i % 6 === 0 ? 8 : 4);
    return { x1: size / 2 + Math.cos(a) * outer, y1: size / 2 + Math.sin(a) * outer, x2: size / 2 + Math.cos(a) * inner, y2: size / 2 + Math.sin(a) * inner, major: i % 6 === 0 };
  });
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} /><stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#D6C8B4" strokeWidth={t.major ? 1.5 : 1} opacity={t.major ? 0.7 : 0.4} />)}
        <circle cx={size / 2} cy={size / 2} r={radius} className="stroke-current text-paper-200/80" strokeWidth={strokeWidth} fill="transparent" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={`url(#${gradientId})`} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" fill="transparent"
          style={{ filter: `drop-shadow(0 2px 6px ${RING_GLOW[level]})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[40px] font-black leading-none tabular-nums tracking-tight text-ink-900">
          {shown}<span className="ml-0.5 text-xl font-bold text-ink-300">%</span>
        </span>
        <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">เฉลี่ยรวม</span>
      </div>
    </div>
  );
}

/* ─── Aggregated data shape ─── */
interface WeekResult {
  week: string;
  wkNum: string;
  percent: number;
  score: number;
  total: number;
  topics: TopicMastery[];
  misconceptions: Misconception[];
  quiz: Quiz;
  answers: StudentAnswers;
}

/* ════════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════════ */
export default function StudentOverallSummary({ courseId }: { courseId: string }) {
  const { getCourse, submissions, studentId, hydrated, setActiveCourse } = useCourse();

  useEffect(() => { if (courseId) setActiveCourse(courseId); }, [courseId, setActiveCourse]);

  const course = getCourse(courseId);

  // การกด back ของ browser ให้กลับไปหน้า course ถูกจัดการรวมศูนย์ที่ BackToCourseGuard
  // (app/layout.tsx) แทน — เพราะ popstate listener ที่ผูกไว้ในหน้านี้เองจะถูกถอด (unmount)
  // ระหว่างที่ Next.js กำลังจัดการ popstate event เดียวกันอยู่พอดี ทำให้ไม่ทำงาน

  /* --- สร้าง weekResults จากผลข้อสอบจากอาจารย์ (official only) --- */
  const weekResults = useMemo<WeekResult[]>(() => {
    if (!course) return [];
    const mySubs = submissions.filter((s) => s.isCurrentUser || s.studentId === studentId);

    const weekKeys = Array.from(
      new Set(mySubs.map((s) => s.week))
    ).sort((a, b) => Number(weekNumber(a)) - Number(weekNumber(b)));

    const results: WeekResult[] = [];
    for (const wk of weekKeys) {
      const quizzesForWeek = course.quizzes[wk] ?? [];
      if (quizzesForWeek.length === 0) continue;
      const quiz = quizzesForWeek[0];
      const sub = mySubs
        .filter((s) => s.week === wk)
        .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))[0];
      if (!sub) continue;
      const summary = buildStudentSummary(quiz, sub.answers);
      results.push({
        week: wk, wkNum: weekNumber(wk),
        percent: summary.percent, score: summary.score, total: summary.total,
        topics: summary.topics, misconceptions: summary.misconceptions,
        quiz, answers: sub.answers,
      });
    }
    return results;
  }, [course, submissions, studentId]);

  /* --- ดึงข้อมูลฝึกซ้อม (แบบฝึกหัดเจาะจุดอ่อน) จาก backend จริงทุกสัปดาห์ --- */

  const [practiceByWeek, setPracticeByWeek] = useState<Record<string, PracticeAttempt[]>>({});
  // แหล่งข้อมูลที่เลือกดู (เฉพาะส่วน "ความเข้าใจรายหัวข้อ") — ข้อสอบอาจารย์ หรือ ฝึกซ้อม
  const [source, setSource] = useState<"official" | "practice">("official");
  // แสดงหัวข้อครบทุกอันหรือแค่ 5 อันแรก
  const [showAllTopics, setShowAllTopics] = useState(false);
  // "จุดที่ตอบผิด" ปิดไว้ก่อนโดยดีฟอลต์ — อาจยาวถ้ารวมหลายสัปดาห์ ให้กดเปิดเอง
  const [misconceptionsOpen, setMisconceptionsOpen] = useState(false);

  useEffect(() => {
    if (!course || !hydrated || !studentId) {
      setPracticeByWeek({});
      return;
    }
    let cancelled = false;
    const weeks = Object.keys(course.quizzes).filter(
      (wk) => (course.quizzes[wk] ?? []).length > 0,
    );
    Promise.all(
      weeks.map(async (wk) => {
        const quiz = course.quizzes[wk][0];
        try {
          const list = await fetchPracticeQuizzes(quiz.id, studentId);
          const completed = list.filter((p) => p.status === "completed");
          const built = await Promise.all(
            completed.map(async (p): Promise<PracticeAttempt | null> => {
              try {
                const [{ quiz: pq }, subs] = await Promise.all([
                  fetchPracticeQuiz(p.id),
                  fetchPracticeQuizSubmissions(p.id, studentId),
                ]);
                const latest = subs[0];
                if (!pq || !latest) return null;
                const answers: StudentAnswers = {};
                for (const q of latest.questions) answers[q.questionId] = q.chosenId;
                return {
                  id: p.id,
                  at: latest.submittedAt,
                  score: latest.score,
                  total: latest.total,
                  percent: Math.round(latest.percent),
                  quiz: pq,
                  answers,
                };
              } catch {
                return null;
              }
            }),
          );
          return [wk, built.filter((a): a is PracticeAttempt => a !== null)] as const;
        } catch {
          return [wk, [] as PracticeAttempt[]] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      const map: Record<string, PracticeAttempt[]> = {};
      for (const [wk, attempts] of entries) {
        if (attempts.length > 0) map[wk] = attempts;
      }
      setPracticeByWeek(map);
    });
    return () => {
      cancelled = true;
    };
  }, [course, studentId, hydrated]);


  /* --- Aggregate overall data --- */
  const overall = useMemo(() => {
    if (weekResults.length === 0) return null;
    const avgPercent = Math.round(weekResults.reduce((s, r) => s + r.percent, 0) / weekResults.length);

    // Merge topics across all weeks
    const topicMap = new Map<string, { correct: number; total: number }>();
    for (const r of weekResults) {
      for (const t of r.topics) {
        const cur = topicMap.get(t.topic) ?? { correct: 0, total: 0 };
        cur.correct += t.correct; cur.total += t.total;
        topicMap.set(t.topic, cur);
      }
    }
    const allTopics: TopicMastery[] = Array.from(topicMap.entries())
      .map(([topic, { correct, total }]) => {
        const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { topic, correct, total, percent, level: levelOf(percent) };
      })
      .sort((a, b) => b.percent - a.percent);

    const allMisconceptions = weekResults.flatMap((r) => r.misconceptions);
    // จุดที่ตอบผิด แบ่งเป็นรายสัปดาห์ — เอาไว้โชว์เป็นกลุ่ม ไม่ยาวรวมเป็นก้อนเดียว
    const misconceptionsByWeek = weekResults
      .filter((r) => r.misconceptions.length > 0)
      .map((r) => ({ week: r.week, wkNum: r.wkNum, items: r.misconceptions }));

    // CLO radar — aggregate across all quizzes
    const cloData: CloMastery[] = course?.clos?.length
      ? buildCloMastery(
          weekResults.map((r) => r.quiz),
          weekResults.map((r) => r.answers),
          course.clos,
        )
      : [];

    return { avgPercent, allTopics, allMisconceptions, misconceptionsByWeek, cloData };
  }, [weekResults, course]);

  /* --- ความเข้าใจรายหัวข้อ จากการฝึกซ้อม (รอบล่าสุดของแต่ละสัปดาห์) --- */
  const practiceTopics = useMemo<TopicMastery[]>(() => {
    const topicMap = new Map<string, { correct: number; total: number }>();
    // รวมทุกรอบฝึกซ้อมที่เคยทำ (ไม่ใช่แค่รอบล่าสุด) เพื่อให้เห็นภาพรวมความเข้าใจจริง ๆ
    for (const attempts of Object.values(practiceByWeek)) {
      for (const attempt of attempts) {
        const summary = buildStudentSummary(attempt.quiz, attempt.answers);
        for (const t of summary.topics) {
          const cur = topicMap.get(t.topic) ?? { correct: 0, total: 0 };
          cur.correct += t.correct; cur.total += t.total;
          topicMap.set(t.topic, cur);
        }
      }
    }
    return Array.from(topicMap.entries())
      .map(([topic, { correct, total }]) => {
        const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { topic, correct, total, percent, level: levelOf(percent) };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [practiceByWeek]);

  /* --- count-up hooks (fixed order) --- */
  const avgShown = useCountUp(overall?.avgPercent ?? 0);
  const strongShown = useCountUp(overall?.allTopics.filter((t) => t.level === "strong").length ?? 0);
  const weakShown = useCountUp(overall?.allTopics.filter((t) => t.level === "weak").length ?? 0);

  /* --- สรุปการฝึกซ้อม --- */
  const practiceSummary = useMemo(() => {
    const weeks = Object.entries(practiceByWeek);
    if (weeks.length === 0) return null;
    const totalRounds = weeks.reduce((s, [, arr]) => s + arr.length, 0);
    const allPercents = weeks.flatMap(([, arr]) => arr.map((a) => a.percent));
    const avgPractice = allPercents.length > 0
      ? Math.round(allPercents.reduce((s, v) => s + v, 0) / allPercents.length)
      : 0;
    const perWeek = weeks
      .map(([wk, arr]) => ({
        wk,
        wkNum: weekNumber(wk),
        rounds: arr.length,
        best: Math.max(...arr.map((a) => a.percent)),
        last: arr[arr.length - 1].percent,
      }))
      .sort((a, b) => Number(a.wkNum) - Number(b.wkNum));
    return { totalRounds, avgPractice, perWeek };
  }, [practiceByWeek]);


  /* ─── Loading / empty states ─── */
  if (!hydrated) return <div className="grid place-items-center py-24 text-sm text-ink-400">กำลังโหลด…</div>;

  if (!course) {
    return (
      <div>
        <div className="mb-6 text-sm font-medium text-ink-400">
          <Link href="/student" className="transition-colors hover:text-tu-red-600">รายวิชาเรียน</Link>
          <span className="mx-2 text-ink-300">/</span>
          <span className="text-ink-700">ไม่พบรายวิชา</span>
        </div>
        <div className="card-empty">
          <h2 className="display text-lg">ไม่พบรายวิชา</h2>
          <Link href="/student" className="btn-primary mt-5">ย้อนกลับ</Link>
        </div>
      </div>
    );
  }

  if (weekResults.length === 0 || !overall) {
    return (
      <div>
        <div className="mb-6 text-sm font-medium text-ink-400">
          <Link href="/student" className="transition-colors hover:text-tu-red-600">รายวิชาเรียน</Link>
          <span className="mx-2 text-ink-300">/</span>
          <Link href={`/student/course/${course.id}`} className="transition-colors hover:text-tu-red-600">{course.subject}</Link>
          <span className="mx-2 text-ink-300">/</span>
          <span className="text-ink-700">วิเคราะห์ผลการเรียนรู้</span>
        </div>
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีผลแบบทดสอบ</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            ทำแบบทดสอบของวิชานี้ก่อน ระบบจะทำการวิเคราะห์ผลการเรียนรู้ให้
          </p>
          <Link href={`/student/course/${course.id}`} className="btn-primary mt-5">กลับไปหน้ารายวิชา</Link>
        </div>
      </div>
    );
  }

  const level = levelOf(overall.avgPercent);
  const strongest = overall.allTopics[0];
  const weakest = overall.allTopics[overall.allTopics.length - 1];
  const hasWeak = weakest && weakest.level !== "strong";
  // หัวข้อที่จะแสดงในส่วน "ความเข้าใจรายหัวข้อ" — สลับตามแหล่งข้อมูลที่เลือก
  const topicsToShow = source === "official" ? overall.allTopics : practiceTopics;
  const visibleTopics = showAllTopics ? topicsToShow : topicsToShow.slice(0, 5);

  return (
    <div className="relative space-y-10">

      {/* ─── Breadcrumb ─── */}
      <div className="text-sm font-medium text-ink-400">
        <Link href="/student" className="transition-colors hover:text-tu-red-600">รายวิชาเรียน</Link>
        <span className="mx-2 text-ink-300">/</span>
        <Link href={`/student/course/${course.id}`} className="transition-colors hover:text-tu-red-600">{course.subject}</Link>
        <span className="mx-2 text-ink-300">/</span>
        <span className="text-ink-700">วิเคราะห์ผลการเรียนรู้</span>
      </div>

      {/* ─── Header + Week Buttons ─── */}
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">ภาพรวมทั้งวิชา · {course.subject}</p>
            <h1 className="display mt-1.5 text-2xl sm:text-3xl md:text-[32px]">
              วิเคราะห์ผลการเรียนรู้ของคุณ
            </h1>
            <hr className="rule-gold my-3" />
            <p className="max-w-lg text-sm leading-relaxed text-ink-500">
              รวมผลจากแบบทดสอบข้อสอบจากอาจารย์ {weekResults.length} สัปดาห์ที่ทำแล้ว
              {course.clos.length > 0 && ` · วัดผล ${course.clos.length} ผลลัพธ์การเรียนรู้ (CLO)`}
            </p>
          </div>

          {/* ป้ายระบุภาพรวมทั้งวิชาแบบฟิกซ์คงที่ */}
          <div className="flex flex-shrink-0 flex-col items-end gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tu-red-50 px-3.5 py-1.5 text-xs font-bold text-tu-red-700 ring-1 ring-tu-red-200">
              ภาพรวมทั้งวิชา
            </span>

            {/* โชว์เฉพาะเมื่อทั้งคอร์สมีข้อมูลฝึกซ้อมอย่างน้อย 1 สัปดาห์ (มีแหล่งเดียวไม่ต้องมีปุ่มสลับ) */}
            {Object.keys(practiceByWeek).length > 0 && (
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-400">แสดงผลจาก</span>
                  <div className="inline-flex items-center gap-1 rounded-xl bg-paper-100 p-1">
                    <button
                      type="button"
                      onClick={() => setSource("official")}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tu-red-300 ${
                        source === "official"
                          ? "bg-white text-tu-red-700 shadow-sm"
                          : "text-ink-500 hover:text-ink-700"
                      }`}
                    >
                      ข้อสอบอาจารย์
                    </button>
                    <button
                      type="button"
                      onClick={() => setSource("practice")}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tu-red-300 ${
                        source === "practice"
                          ? "bg-white text-tu-red-700 shadow-sm"
                          : "text-ink-500 hover:text-ink-700"
                      }`}
                    >
                      ฝึกซ้อม
                    </button>
                  </div>
                </div>
                {source === "practice" && (
                  <p className="text-[11px] text-ink-400">รวมทุกรอบฝึกซ้อมที่เคยทำ</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {/* ─── KPI Inline Stats ─── */}
      <Reveal delay={40}>
        <div className="flex flex-wrap items-end gap-x-10 gap-y-4 border-b border-line-soft pb-7">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">คะแนนเฉลี่ยรวม</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-ink-900">
              {avgShown}<span className="ml-1 text-base font-semibold text-ink-300">%</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">เข้าใจดี (≥80%)</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-[#047857]">
              {strongShown}<span className="ml-1 text-base font-semibold text-ink-300">หัวข้อ</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">ควรทบทวน (&lt;50%)</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-tu-red-600">
              {weakShown}<span className="ml-1 text-base font-semibold text-ink-300">หัวข้อ</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">สัปดาห์ที่ทำแล้ว</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-ink-900">
              {weekResults.length}<span className="ml-1 text-base font-semibold text-ink-300">สัปดาห์</span>
            </p>
          </div>
        </div>
      </Reveal>

      {/* ─── Hero: Score Ring + CLO Radar ─── */}

      <Reveal>
        <section className="flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-16">
          {/* Left: Score Ring + Sparkline */}
          <div className="flex flex-col items-center md:w-2/5">
            <span className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-400">
              <span className={`h-2 w-2 rounded-full ${level === "strong" ? "bg-emerald-500" : level === "weak" ? "bg-tu-red-500" : "bg-tu-gold-500"}`} />
              เฉลี่ย {weekResults.length} สัปดาห์ (ข้อสอบจากอาจารย์)
            </span>
            <ScoreRing percent={overall.avgPercent} size={170} strokeWidth={11} />
            <span className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${LEVEL_CHIP[level]}`}>
              <span aria-hidden>{LEVEL_META[level].icon}</span>
              {LEVEL_META[level].label}
            </span>
          </div>

          {/* Right: CLO Radar */}
          <div className="flex-1 md:w-3/5">
            <div className="mb-2">
              <h3 className="display text-lg">ผลลัพธ์การเรียนรู้ (CLO) ภาพรวมทั้งวิชา</h3>
              <p className="mt-0.5 text-xs text-ink-500">รวมคะแนนจากทุกสัปดาห์ที่ทำแบบทดสอบ</p>
            </div>
            <div className="flex items-center justify-center">
              <CloRadar clos={overall.cloData} />
            </div>
            {overall.cloData.length > 0 && (
              <div className="mt-3 divide-y divide-line-soft rounded-xl border border-line-soft bg-paper-50/60 px-4 py-2">
                {overall.cloData.map((c) => (
                  <div key={c.code} className="flex items-center justify-between gap-3 py-2">
                    <span className="flex-shrink-0 text-[11px] font-bold text-ink-700">{c.code}</span>
                    <span className="min-w-0 flex-1 text-[11px] leading-snug text-ink-500">{c.description}</span>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-paper-200">
                        <div
                          className={`h-full rounded-full ${c.percent >= 80 ? "bg-emerald-500" : c.percent >= 50 ? "bg-tu-gold-400" : "bg-tu-red-500"}`}
                          style={{ width: `${c.percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold tabular-nums text-ink-800">{c.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </Reveal>

      {/* ─── กราฟพัฒนาการรายสัปดาห์ ─── */}
      <Reveal>
        <section className="border-t border-line-soft pt-10">
          <div className="mb-1 flex items-start justify-between gap-3">
            <h2 className="display text-lg">พัฒนาการรายสัปดาห์</h2>
            <span className="flex-shrink-0 rounded-full bg-paper-100 px-3 py-1 text-[11px] font-bold text-ink-500">
              {weekResults.length} สัปดาห์
            </span>
          </div>
          <p className="mb-4 text-xs text-ink-400">คะแนนสอบจากอาจารย์ในแต่ละสัปดาห์ (%)</p>
          <ImprovementChart
            scores={weekResults.map((r) => r.percent)}
            labels={weekResults.map((r) => `สัปดาห์ ${r.wkNum}`)}
          />
        </section>
      </Reveal>

      {/* ─── สรุปทุกหัวข้อที่เรียน ─── */}
      <div className="border-t border-line-soft pt-10">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <section>
              <div className="mb-1 flex items-start justify-between gap-3">
                <h2 className="display text-lg">ความเข้าใจรายหัวข้อ</h2>
                <span className="flex-shrink-0 rounded-full bg-paper-100 px-3 py-1 text-[11px] font-bold text-ink-500">
                  {topicsToShow.length} หัวข้อ
                </span>
              </div>
              <p className="mb-4 text-xs text-ink-400">คิดจากสัดส่วนข้อที่ตอบถูกในแต่ละหัวข้อ</p>

              {topicsToShow.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-400">
                  {source === "official" ? "ยังไม่มีผลข้อสอบอาจารย์" : "ยังไม่มีประวัติการฝึกซ้อม"}
                </p>
              ) : (
                <div className="divide-y divide-line-soft">
                  {visibleTopics.map((t) => {
                    const meta = LEVEL_META[t.level];
                    return (
                      <div key={t.topic} className="py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate text-sm font-semibold text-ink-800">
                            {t.topic}
                          </span>
                          <span
                            className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ backgroundColor: `${meta.hex}1A`, color: meta.hex }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-200">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${t.percent}%`, backgroundColor: meta.hex }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {topicsToShow.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllTopics((v) => !v)}
                  className="mt-4 block w-full text-center text-xs font-bold text-tu-red-600 hover:text-tu-red-700"
                >
                  {showAllTopics ? "ย่อรายการ" : "ดูหัวข้อทั้งหมด"}
                </button>
              )}
            </section>
          </Reveal>

          <Reveal delay={100}>
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="display text-lg">สรุปข้อสังเกต</h2>
              </div>
              <hr className="rule-gold mb-5" />
              <div className="space-y-5">
                {hasWeak ? (
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-tu-red-700 uppercase">
                      <span className="h-2 w-2 rounded-full bg-tu-red-600" />
                      จุดที่ควรโฟกัสที่สุด
                    </p>
                    <p className="pl-4 text-sm leading-relaxed text-ink-700">
                      เรื่อง <span className="font-semibold text-ink-950">&ldquo;{weakest.topic}&rdquo;</span>{" "}
                      ยังเป็นจุดอ่อนที่สุดในภาพรวม — ตอบถูก {weakest.correct}/{weakest.total} ข้อ ({weakest.percent}%)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-emerald-700 uppercase">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      ทำได้ดีทุกหัวข้อ
                    </p>
                    <p className="pl-4 text-sm leading-relaxed text-ink-700">
                      ทุกหัวข้อที่เรียนผ่านเกณฑ์เข้าใจดีทั้งหมด — ลองอ่านเนื้อหาสัปดาห์ถัดไปล่วงหน้าได้เลย
                    </p>
                  </div>
                )}

                {strongest?.level === "strong" && (
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-emerald-700 uppercase">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      จุดแข็งของคุณ
                    </p>
                    <p className="pl-4 text-sm leading-relaxed text-ink-700">
                      เข้าใจเรื่อง{" "}
                      <span className="font-semibold text-ink-950">&ldquo;{strongest.topic}&rdquo;</span>{" "}
                      ได้ดีที่สุด ({strongest.percent}%) — ใช้ความเข้าใจนี้ต่อยอดหัวข้อที่ยังไม่แม่น
                    </p>
                  </div>
                )}

                {overall.allTopics
                  .filter((t) => t !== weakest && t !== strongest)
                  .map((t) => (
                    <div key={t.topic} className="space-y-1">
                      <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-ink-500 uppercase">
                        <span className={`h-2 w-2 rounded-full ${t.level === "weak" ? "bg-tu-red-500" : t.level === "medium" ? "bg-tu-gold-500" : "bg-emerald-500"}`} />
                        {t.topic}
                      </p>
                      <p className="pl-4 text-sm leading-relaxed text-ink-600">
                        อยู่ระดับ{LEVEL_META[t.level].label} ({t.percent}%)
                        {t.level === "medium" ? " — ยังขยับเป็นเข้าใจดีได้อีก"
                          : t.level === "weak" ? " — ควรกลับไปทบทวน"
                          : " — รักษาความเข้าใจนี้ไว้"}
                      </p>
                    </div>
                  ))}
              </div>
            </section>
          </Reveal>
        </div>
      </div>

      {/* ─── จุดที่ตอบผิด แยกรายสัปดาห์ — ปิดไว้ก่อนโดยดีฟอลต์ กันหน้ารก ─── */}
      {overall.allMisconceptions.length > 0 && (
        <Reveal>
          <div className="border-t border-line-soft pt-10">
            <button
              type="button"
              onClick={() => setMisconceptionsOpen((v) => !v)}
              aria-expanded={misconceptionsOpen}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <h2 className="display text-lg">จุดที่ตอบผิด แยกรายสัปดาห์</h2>
                <p className="mt-1 text-sm text-ink-500">เทียบคำตอบที่คุณเลือกกับคำตอบที่ถูก</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <span className="rounded-full bg-tu-red-50 px-3 py-1 text-xs font-bold tabular-nums text-tu-red-600 ring-1 ring-tu-red-100">
                  ผิด {overall.allMisconceptions.length} ข้อ
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-ink-400 transition-transform ${misconceptionsOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>
            <hr className="rule-gold mt-4 mb-6" />

            {misconceptionsOpen && (
              <div className="space-y-8">
                {overall.misconceptionsByWeek.map(({ week, wkNum, items }) => (
                  <div key={week}>
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-tu-red-500 text-[11px] font-bold text-white">
                        {wkNum}
                      </span>
                      <h3 className="text-sm font-bold text-ink-800">สัปดาห์ที่ {wkNum}</h3>
                      <span className="text-xs text-ink-400">· ผิด {items.length} ข้อ</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((m, i) => (
                        <div key={i} className="rounded-xl px-4 py-4 transition-colors hover:bg-paper-100/50 sm:px-5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-tu-gold-600">{m.topic}</span>
                          <p className="mt-2 text-[15px] font-semibold leading-relaxed text-ink-900">
                            <span className="mr-1.5 font-black text-ink-300">{i + 1}.</span>{m.question}
                          </p>
                          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:gap-10">
                            <div className="flex-1">
                              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">คุณตอบ</p>
                              <p className="flex items-start gap-2 text-sm font-medium text-tu-red-600">
                                <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-tu-red-50 text-[10px] font-bold ring-1 ring-tu-red-100">✕</span>
                                {m.chosenText}
                              </p>
                            </div>
                            <div className="flex-1">
                              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">คำตอบที่ถูก</p>
                              <p className="flex items-start gap-2 text-sm font-medium text-[#047857]">
                                <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold ring-1 ring-emerald-200">✓</span>
                                {m.correctText}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      )}


    </div>
  );
}
