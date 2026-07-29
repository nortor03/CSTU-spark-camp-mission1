"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import {
  buildClassReport,
  levelOf,
  type Submission,
  type TopicMastery,
  type HardQuestion,
} from "@/lib/analytics";
import { generateMockSubmissions } from "@/lib/mockClass";
import { weekNumber } from "@/lib/weeks";
import { buildCloMastery } from "@/components/student/CloRadar";
import SkillClusters from "@/components/teacher/report/class-report/SkillClusters";
import StudentOverallTable, {
  type StudentAggRow,
} from "@/components/teacher/report/class-report/StudentOverallTable";
import { getPracticeHistory } from "@/lib/practiceHistory";
import { ChevronDown } from "lucide-react";
import type { Quiz } from "@/lib/quiz";
import type { StudentAnswers } from "@/lib/feedback";

interface WeekAgg {
  week: string;
  wkNum: string;
  quiz: Quiz;
  submissions: Submission[];
  average: number;
  studentCount: number;
  topics: TopicMastery[];
  hardest: HardQuestion[];
}

/**
 * ภาพรวมทั้งวิชา (ทุกสัปดาห์รวมกัน) ฝั่งอาจารย์ — คู่กับ ClassReport (รายสัปดาห์)
 * โครงสร้าง/ตรรกะเดียวกับหน้าภาพรวมฝั่งนักเรียน (StudentOverallSummary) แต่รวมทั้งชั้นเรียน
 * ใช้หัวข้อ/CLO ที่มีอยู่จริงในวิชา (course.clos / course.topics) ไม่ใช่ข้อมูลสมมติ
 */
export default function ClassOverallReport({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { getCourse, setActiveCourse, activeCourseId, hydrated, studentId } = useCourse();
  const course = getCourse(courseId);

  useEffect(() => {
    if (course && activeCourseId !== courseId) setActiveCourse(courseId);
  }, [course, courseId, activeCourseId, setActiveCourse]);

  // สรุปผลรายสัปดาห์ (เฉพาะสัปดาห์ที่มีควิซ) — ควิซจริง + เพื่อนร่วมชั้นจำลอง เหมือนหน้ารายสัปดาห์
  const weekAggs = useMemo<WeekAgg[]>(() => {
    if (!course) return [];
    return Object.entries(course.quizzes)
      .map(([week, list]) => {
        const quiz = list.find((q) => q.isActive) ?? list[0];
        if (!quiz) return null;
        const submissions = [
          ...generateMockSubmissions(quiz),
          ...course.submissions.filter((s) => s.week === week),
        ];
        const report = buildClassReport(quiz, submissions);
        return {
          week,
          wkNum: weekNumber(week),
          quiz,
          submissions,
          average: report.average,
          studentCount: report.studentCount,
          topics: report.topics,
          hardest: report.hardest,
        };
      })
      .filter((w): w is WeekAgg => w !== null)
      .sort((a, b) => Number(a.wkNum) - Number(b.wkNum));
  }, [course]);

  const [misconceptionsOpen, setMisconceptionsOpen] = useState(false);

  const overall = useMemo(() => {
    if (weekAggs.length === 0) return null;

    const avgPercent = Math.round(
      weekAggs.reduce((s, w) => s + w.average, 0) / weekAggs.length,
    );
    const studentCount = new Set(
      weekAggs.flatMap((w) => w.submissions.map((s) => s.studentId)),
    ).size;

    // รวมหัวข้อข้ามทุกสัปดาห์
    const topicMap = new Map<string, { correct: number; total: number }>();
    for (const w of weekAggs) {
      for (const t of w.topics) {
        const cur = topicMap.get(t.topic) ?? { correct: 0, total: 0 };
        cur.correct += t.correct;
        cur.total += t.total;
        topicMap.set(t.topic, cur);
      }
    }
    const allTopics: TopicMastery[] = Array.from(topicMap.entries())
      .map(([topic, { correct, total }]) => {
        const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { topic, correct, total, percent, level: levelOf(percent) };
      })
      .sort((a, b) => b.percent - a.percent);

    // CLO รวมทุกสัปดาห์ — จากคำตอบของทุกคนในทุกสัปดาห์
    let cloMastery: ReturnType<typeof buildCloMastery> = [];
    if (course?.clos?.length) {
      const quizzes: Quiz[] = [];
      const answersList: StudentAnswers[] = [];
      for (const w of weekAggs) {
        for (const s of w.submissions) {
          quizzes.push(w.quiz);
          answersList.push(s.answers);
        }
      }
      cloMastery = buildCloMastery(quizzes, answersList, course.clos);
    }

    return { avgPercent, studentCount, allTopics, cloMastery };
  }, [weekAggs, course]);

  const classClusters = useMemo(() => {
    if (!overall) return [];
    const allSubs = weekAggs.flatMap((w) => w.submissions);
    const total = allSubs.length || 1;
    const strong = allSubs.filter((s) => levelOf(s.percent) === "strong").length;
    const weak = allSubs.filter((s) => levelOf(s.percent) === "weak").length;
    const medium = total - strong - weak;
    const sortedClo = [...overall.cloMastery].sort((a, b) => b.percent - a.percent);
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
  }, [overall, weekAggs]);

  const totalHardCount = weekAggs.reduce(
    (s, w) => s + w.hardest.filter((h) => h.correctRate < 70).length,
    0,
  );

  // สรุปรายบุคคลรวมทั้งวิชา — คะแนนเฉลี่ย/CLO คำนวณจากคำตอบจริงของแต่ละคนสะสมทุกสัปดาห์
  const studentRows = useMemo<StudentAggRow[]>(() => {
    if (!course) return [];
    const map = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        isCurrentUser: boolean;
        percents: number[];
        quizzes: Quiz[];
        answersList: StudentAnswers[];
        weeks: Set<string>;
        latestWkNum: string;
      }
    >();
    for (const w of weekAggs) {
      for (const s of w.submissions) {
        let entry = map.get(s.studentId);
        if (!entry) {
          entry = {
            studentId: s.studentId,
            studentName: s.studentName,
            isCurrentUser: !!s.isCurrentUser,
            percents: [],
            quizzes: [],
            answersList: [],
            weeks: new Set(),
            latestWkNum: w.wkNum,
          };
          map.set(s.studentId, entry);
        }
        entry.percents.push(s.percent);
        entry.quizzes.push(w.quiz);
        entry.answersList.push(s.answers);
        entry.weeks.add(w.week);
        if (Number(w.wkNum) >= Number(entry.latestWkNum)) entry.latestWkNum = w.wkNum;
      }
    }
    return Array.from(map.values()).map((e) => {
      const avgPercent = Math.round(e.percents.reduce((a, b) => a + b, 0) / e.percents.length);
      const cloRows =
        course.clos.length > 0 ? buildCloMastery(e.quizzes, e.answersList, course.clos) : [];
      return {
        studentId: e.studentId,
        studentName: e.studentName,
        isCurrentUser: e.isCurrentUser,
        avgPercent,
        weeksDone: e.weeks.size,
        cloPercents: cloRows.map((c) => ({ code: c.code, percent: c.percent })),
        latestWkNum: e.latestWkNum,
      };
    });
  }, [weekAggs, course]);

  // จำนวนครั้งฝึกซ้อมจริงของผู้ใช้ปัจจุบัน (เพื่อนร่วมชั้นจำลองไม่มีประวัติฝึกซ้อมจริงให้อ่าน)
  // อ่าน localStorage ใน useEffect เท่านั้น กัน hydration mismatch
  const [currentUserPracticeCount, setCurrentUserPracticeCount] = useState<number | null>(null);
  useEffect(() => {
    if (!course || !hydrated) return;
    let total = 0;
    for (const w of weekAggs) {
      total += getPracticeHistory(studentId, courseId, w.week).length;
    }
    setCurrentUserPracticeCount(total);
  }, [course, hydrated, weekAggs, studentId, courseId]);

  // จุดที่ควรโฟกัสทั้งชั้นเรียน — เทมเพลตข้อความอิงข้อมูลจริง (หัวข้อ/CLO ที่ดี-แย่ที่สุด)
  const insight = useMemo(() => {
    if (!overall || overall.allTopics.length === 0) return null;
    const strongest = overall.allTopics[0];
    const weakest = overall.allTopics[overall.allTopics.length - 1];
    const sortedClo = [...overall.cloMastery].sort((a, b) => a.percent - b.percent);
    const worstClo = sortedClo[0];
    const hasContrast = weakest && strongest && weakest.topic !== strongest.topic;
    return { strongest, weakest, worstClo, hasContrast };
  }, [overall]);

  if (!hydrated) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  if (!course) {
    return (
      <div className="card-empty">
        <h2 className="display text-lg">ไม่พบรายวิชานี้</h2>
        <Link href="/report" className="btn-primary mt-5">
          ← กลับไปเลือกวิชา
        </Link>
      </div>
    );
  }

  if (weekAggs.length === 0 || !overall) {
    return (
      <div>
        <div className="mb-3 text-sm font-medium text-ink-500">
          <Link href="/course" className="hover:text-tu-red-600">
            รายวิชาทั้งหมด
          </Link>
          <span className="mx-2 text-ink-300">›</span>
          <span className="text-ink-700">{course.subject}</span>
        </div>
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีแบบทดสอบในวิชานี้</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            รายงานจะปรากฏเมื่อสร้างแบบทดสอบอย่างน้อยหนึ่งสัปดาห์
          </p>
          <Link href={`/course/${course.id}`} className="btn-primary mt-5">
            ไปสร้างแบบทดสอบ
          </Link>
        </div>
      </div>
    );
  }

  const firstWeek = weekAggs[0].wkNum;

  return (
    <div className="space-y-10">
      <div>
        <div className="mb-2 text-sm font-medium text-ink-500">
          <Link href="/course" className="hover:text-tu-red-600">
            รายวิชาทั้งหมด
          </Link>
          <span className="mx-2 text-ink-300">›</span>
          <span className="text-ink-700">{course.subject}</span>
        </div>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">ภาพรวมทั้งวิชา</p>
            <h1 className="display mt-1.5 text-2xl sm:text-3xl md:text-[32px]">
              ภาพรวมนักศึกษาทั้งวิชา
            </h1>
            <hr className="rule-gold my-3" />
            <p className="max-w-lg text-sm leading-relaxed text-ink-500">
              รวมผล {weekAggs.length} สัปดาห์ที่มีแบบทดสอบ
              {course.clos.length > 0 && ` · วัดผล ${course.clos.length} ผลลัพธ์การเรียนรู้ (CLO)`}
            </p>
          </div>

          <div className="inline-flex flex-shrink-0 items-center gap-1 self-start rounded-xl bg-paper-100 p-1">
            <button
              type="button"
              className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-tu-red-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tu-red-300"
            >
              ภาพรวม
            </button>
            <button
              type="button"
              onClick={() => router.replace(`/report/${courseId}/${firstWeek}`)}
              className="rounded-lg px-4 py-2 text-sm font-bold text-ink-500 transition hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-tu-red-300"
            >
              รายสัปดาห์
            </button>
          </div>
        </div>
      </div>

      {/* ---------- ตัวเลขสำคัญ ---------- */}
      <div className="flex flex-wrap items-end gap-x-10 gap-y-4 border-b border-line-soft pb-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">นักศึกษาทั้งหมด</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-ink-900">
            {overall.studentCount}
            <span className="ml-1 text-base font-semibold text-ink-300">คน</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">คะแนนเฉลี่ยรวม</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-ink-900">
            {overall.avgPercent}
            <span className="ml-1 text-base font-semibold text-ink-300">%</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">สัปดาห์ที่มีข้อมูล</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-ink-900">
            {weekAggs.length}
            <span className="ml-1 text-base font-semibold text-ink-300">สัปดาห์</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">หัวข้อที่ควรทบทวน</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-tu-red-600">
            {overall.allTopics.filter((t) => t.level === "weak").length}
            <span className="ml-1 text-base font-semibold text-ink-300">หัวข้อ</span>
          </p>
        </div>
      </div>

      {/* ---------- จุดที่ควรโฟกัสทั้งชั้นเรียน ---------- */}
      {insight && (
        <div>
          <h2 className="display text-lg">จุดที่ควรโฟกัสทั้งชั้นเรียน</h2>
          {insight.hasContrast ? (
            <div className="mt-4 grid grid-cols-1 divide-y divide-ink-100 sm:grid-cols-3 sm:divide-y-0 sm:divide-x sm:divide-ink-100">
              <div className="py-4 first:pt-0 sm:py-0 sm:pr-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">จุดเด่นของชั้นเรียน</p>
                <h3 className="mt-2 text-sm font-bold text-ink-900 leading-snug">{insight.strongest.topic}</h3>
                <p className="mt-2 text-2xl font-extrabold tabular-nums text-emerald-700">
                  {insight.strongest.percent}
                  <span className="ml-1 text-xs font-semibold text-ink-400">% อัตราการผ่านเกณฑ์</span>
                </p>
              </div>

              <div className="py-4 sm:py-0 sm:px-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">จุดที่ควรเร่งทบทวน</p>
                <h3 className="mt-2 text-sm font-bold text-ink-900 leading-snug">{insight.weakest.topic}</h3>
                <p className="mt-2 text-2xl font-extrabold tabular-nums text-tu-red-600">
                  {insight.weakest.percent}
                  <span className="ml-1 text-xs font-semibold text-ink-400">% อัตราการผ่านเกณฑ์</span>
                </p>
              </div>

              <div className="py-4 last:pb-0 sm:py-0 sm:pl-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">แนวทางการปฏิบัติถัดไป</p>
                <p className="mt-2 text-sm text-ink-700 leading-relaxed">
                  แนะนำให้เตรียมโจทย์เสริมความเข้าใจหัวข้อ &ldquo;{insight.weakest.topic}&rdquo; เพิ่มเติมก่อนเริ่มสัปดาห์ถัดไป
                  {insight.worstClo && ` (เน้นเนื้อหาตามเป้าหมายของ ${insight.worstClo.code})`}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 divide-y divide-ink-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x sm:divide-ink-100">
              <div className="py-4 first:pt-0 sm:py-0 sm:pr-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">สถานะภาพรวมชั้นเรียน</p>
                <h3 className="mt-2 text-sm font-bold text-ink-900 leading-snug">{insight.strongest.topic}</h3>
                <p className="mt-2 text-2xl font-extrabold tabular-nums text-emerald-700">
                  {insight.strongest.percent}
                  <span className="ml-1 text-xs font-semibold text-ink-400">% อัตราการผ่านเกณฑ์</span>
                </p>
              </div>

              <div className="py-4 last:pb-0 sm:py-0 sm:pl-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">แผนการปฏิบัติถัดไป</p>
                <p className="mt-2 text-sm text-ink-700 leading-relaxed">
                  ประสิทธิภาพการเรียนรู้สอดคล้องตามเกณฑ์มาตรฐาน แนะนำดำเนินการสอนเนื้อหาปกติในสัปดาห์ถัดไปได้ทันที
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- CLO / หัวข้อ ภาพรวมทั้งวิชา ---------- */}
      <SkillClusters
        isQuizAssigned
        cloData={{
          radarAxes: overall.cloMastery.map((c) => ({
            topic: `${c.code}: ${c.description}`,
            percent: c.percent,
          })),
          clusters: classClusters,
        }}
        secondaryData={{
          radarAxes: overall.allTopics.map((t) => ({ topic: t.topic, percent: t.percent })),
          clusters: classClusters,
        }}
      />

      {/* ---------- สรุปรายบุคคลทั้งวิชา ---------- */}
      <StudentOverallTable
        rows={studentRows}
        cloCodes={course.clos.map((c) => c.code)}
        courseSubject={course.subject}
        currentUserPracticeCount={currentUserPracticeCount}
      />

      {/* ---------- จุดที่ตอบผิดมากที่สุด แยกรายสัปดาห์ ---------- */}
      {totalHardCount > 0 && (
        <div className="border-t border-line-soft pt-10">
          <button
            type="button"
            onClick={() => setMisconceptionsOpen((v) => !v)}
            aria-expanded={misconceptionsOpen}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div>
              <h2 className="display text-lg">จุดที่ตอบผิดมากที่สุด แยกรายสัปดาห์</h2>
              <p className="mt-1 text-sm text-ink-500">ข้อที่ทั้งห้องตอบถูกน้อยที่สุด + ตัวเลือกผิดยอดนิยม</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="rounded-full bg-tu-red-50 px-3 py-1 text-xs font-bold tabular-nums text-tu-red-600 ring-1 ring-tu-red-100">
                {totalHardCount} ข้อ
              </span>
              <ChevronDown
                className={`h-4 w-4 text-ink-400 transition-transform ${misconceptionsOpen ? "rotate-180" : ""}`}
              />
            </div>
          </button>
          <hr className="rule-gold mt-4 mb-6" />

          {misconceptionsOpen && (
            <div className="space-y-8">
              {weekAggs.map((w) => {
                const items = w.hardest.filter((h) => h.correctRate < 70);
                if (items.length === 0) return null;
                return (
                  <div key={w.week}>
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-tu-red-500 text-[11px] font-bold text-white">
                        {w.wkNum}
                      </span>
                      <h3 className="text-sm font-bold text-ink-800">สัปดาห์ที่ {w.wkNum}</h3>
                      <span className="text-xs text-ink-400">· {items.length} ข้อ</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((h, i) => {
                        const correctText =
                          h.question.choices.find((c) => c.id === h.question.answer)?.text ?? "—";
                        return (
                          <div
                            key={i}
                            className="rounded-xl px-4 py-4 transition-colors hover:bg-paper-100/50 sm:px-5"
                          >
                            <span className="text-[11px] font-bold uppercase tracking-wider text-tu-gold-600">
                              {h.topic}
                            </span>
                            <p className="mt-2 text-[15px] font-semibold leading-relaxed text-ink-900">
                              <span className="mr-1.5 font-black text-ink-300">{i + 1}.</span>
                              {h.question.question}
                            </p>
                            <p className="mt-1.5 text-xs text-ink-500">
                              ตอบถูกทั้งห้อง {h.correctRate}%
                            </p>
                            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:gap-10">
                              <div className="flex-1">
                                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                                  ตัวเลือกผิดยอดนิยม ({h.topWrongCount} คน)
                                </p>
                                <p className="flex items-start gap-2 text-sm font-medium text-tu-red-600">
                                  <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-tu-red-50 text-[10px] font-bold ring-1 ring-tu-red-100">
                                    ✕
                                  </span>
                                  {h.topWrongText}
                                </p>
                              </div>
                              <div className="flex-1">
                                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">คำตอบที่ถูก</p>
                                <p className="flex items-start gap-2 text-sm font-medium text-[#047857]">
                                  <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold ring-1 ring-emerald-200">
                                    ✓
                                  </span>
                                  {correctText}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
