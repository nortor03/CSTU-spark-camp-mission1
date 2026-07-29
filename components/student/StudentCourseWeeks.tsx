"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCourse } from "@/lib/courseStore";
import { weekNumber, resolveHex } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";
import {
  ChevronDown,
  ChevronLeft,
  FileText,
  Download,
  Lightbulb,
  ClipboardList,
  MessageSquare,
  Pencil,
  CheckCircle2,
  Target,
} from "lucide-react";
import type { Quiz } from "@/lib/quiz";
import type { Submission } from "@/lib/analytics";
import {
  fetchPracticeQuizzes,
  type PracticeQuizSummary,
} from "@/lib/practiceQuizApi";
import { getPracticeHistory } from "@/lib/practiceHistory";
import { fetchWeekNote, saveWeekNote } from "@/lib/notesApi";

interface WeekRow {
  week: string;
  topics: string[];
  files: string[];
  activeQuiz: Quiz | null;
  /** ผลล่าสุดที่นักเรียนคนนี้เคยทำแบบทดสอบของสัปดาห์นี้ไว้ — null = ยังไม่เคยทำ */
  mySubmission: Submission | null;
}

/**
 * หน้ารายละเอียดวิชาฝั่งนักเรียน — หน้าตาคล้ายของอาจารย์ (WEEK + accordion)
 * กดกล่องสัปดาห์แล้วกางเห็น 4 ส่วน: คำแนะนำ · เอกสาร (ดาวน์โหลด) · แบบทดสอบ · บันทึกสรุป
 * read-only ยกเว้นช่องบันทึกสรุป (นักเรียนกรอก/ส่ง/แก้ไขได้ — เก็บใน localStorage)
 */
export default function StudentCourseWeeks({ courseId }: { courseId: string }) {
  const {
    courses,
    getCourse,
    setActiveCourse,
    activeCourseId,
    studentId,
    hydrated,
  } = useCourse();
  const course = getCourse(courseId);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (course && activeCourseId !== courseId) setActiveCourse(courseId);
  }, [course, courseId, activeCourseId, setActiveCourse]);

  function toggleWeek(week: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  }

  const rows = useMemo<WeekRow[]>(() => {
    if (!course) return [];
    const weeks = new Set<string>();
    for (const t of course.topics) if (t.weekAssigned) weeks.add(t.weekAssigned);
    for (const w of Object.keys(course.quizzes)) weeks.add(w);

    return Array.from(weeks)
      .map((week) => {
        const wkTopics = course.topics.filter((t) => t.weekAssigned === week);
        return {
          week,
          topics: wkTopics.map((t) => t.title),
          files: Array.from(
            new Set(wkTopics.map((t) => t.file).filter(Boolean)),
          ),
          activeQuiz:
            (course.quizzes[week] ?? []).find((q) => q.isActive) ?? null,
          mySubmission:
            course.submissions.find(
              (s) => s.week === week && s.isCurrentUser,
            ) ?? null,
        };
      })
      .sort((a, b) => Number(weekNumber(a.week)) - Number(weekNumber(b.week)));
  }, [course]);

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
        <Link href="/student" className="btn-primary mt-5">
          ← กลับไปเลือกวิชา
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/student"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 transition hover:text-tu-red-600"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        รายวิชาทั้งหมด
        {courses.length > 1 && (
          <span className="text-ink-400"> ({courses.length} วิชา)</span>
        )}
      </Link>

      <PageHeader eyebrow="รายละเอียดรายวิชา" title={course.subject} />

      {course.syllabusName && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-line bg-paper-50 px-4 py-3">
          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-tu-red-50 text-tu-red-600">
            <FileText className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Course Syllabus
              {course.courseCode && (
                <span className="ml-1.5 normal-case text-ink-500">
                  · {course.courseCode}
                </span>
              )}
            </p>
            <p className="truncate text-sm font-medium text-ink-700">
              {course.syllabusName}
            </p>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่มีเนื้อหา</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            อาจารย์ยังไม่ได้เปิดเนื้อหาของวิชานี้ กลับมาใหม่อีกครั้งภายหลัง
          </p>
        </div>
      ) : (
        <div className="border-t border-line-soft">
          {rows.map((row) => {
            const wk = weekNumber(row.week);
            const open = expandedWeeks.has(row.week);
            const hasQuiz = row.activeQuiz !== null;
            const hex = resolveHex(course.weekConfig?.[row.week]?.colorKey);

            return (
              <div key={row.week} className="border-b border-line-soft">
                <button
                  type="button"
                  onClick={() => toggleWeek(row.week)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-5 py-5 text-left"
                >
                  <div className="flex-shrink-0">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-300">
                      Week
                    </span>
                    <span
                      className="block text-[42px] font-bold leading-[0.8] tabular-nums"
                      style={{ color: hex }}
                    >
                      {wk.padStart(2, "0")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="max-w-[54ch] text-[15px] font-semibold leading-snug text-ink-900">
                      {row.topics.length > 0
                        ? row.topics.join("  ·  ")
                        : "ไม่มีรายละเอียดหัวข้อ"}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {hasQuiz ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          มีแบบฝึกหัดทบทวน
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-ink-400 bg-paper-100 px-2 py-0.5 rounded-md border border-line-soft">
                          ไม่มีแบบฝึกหัดทบทวน
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>

                {open && (
                  <div className="ml-0 flex flex-col gap-5 pb-6 sm:ml-[76px]">
                    {/* 1. คำแนะนำของสัปดาห์นี้ */}
                    <Section icon={<Lightbulb className="h-4 w-4" />} title="คำแนะนำสัปดาห์นี้" hex={hex}>
                      <p className="text-[13px] leading-relaxed text-ink-600">
                        {row.topics.length > 0
                          ? `ลองทบทวนหัวข้อ “${row.topics[0]}” มาคร่าว ๆ ก่อนเข้าเรียน และจดคำถามที่ยังสงสัยไว้ถามในคาบ`
                          : "เตรียมตัวก่อนเข้าเรียน และจดคำถามที่ยังสงสัยไว้ถามในคาบ"}
                      </p>
                    </Section>


                    {/* 3. แบบทดสอบ (เฉพาะเมื่ออาจารย์เปิดไว้) */}
                    {row.activeQuiz && (
                      <Section icon={<ClipboardList className="h-4 w-4" />} title="แบบทดสอบ" hex={hex}>
                        <div
                          className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3.5"
                          style={{ borderLeft: `3px solid ${hex}` }}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink-800">
                              {row.activeQuiz.title}
                            </p>
                            {row.mySubmission ? (
                              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                ทำแล้ว · ได้ {row.mySubmission.score}/
                                {row.mySubmission.total} ข้อ ({row.mySubmission.percent}%)
                              </p>
                            ) : (
                              <p className="mt-0.5 text-xs text-ink-400">
                                {row.activeQuiz.questions.length} ข้อ
                              </p>
                            )}
                          </div>
                          <Link
                            href={`/student/quiz/${wk}`}
                            className={`flex-shrink-0 px-4 py-2 text-xs ${
                              row.mySubmission ? "btn-secondary" : "btn-primary"
                            }`}
                          >
                            {row.mySubmission ? "ดูผลลัพธ์ →" : "เริ่มทำ →"}
                          </Link>
                        </div>

                        {/* แบบฝึกหัดที่นักเรียนสร้างเองจากข้อที่พลาด — แยกจากแบบทดสอบของอาจารย์ชัดเจน */}
                        {studentId && (
                          <PracticeQuizzesList
                            quizId={row.activeQuiz.id}
                            week={row.week}
                            wkLabel={wk}
                            studentId={studentId}
                            courseId={courseId}
                          />
                        )}
                      </Section>
                    )}

                    {/* 4. บันทึกสรุป (นักเรียนกรอกเอง) */}
                    <Section icon={<MessageSquare className="h-4 w-4" />} title="บันทึกสรุป / สิ่งที่ยังไม่เข้าใจ" hex={hex}>
                      <WeekSummaryNote
                        storageKey={`tonlabkit:note:${studentId ?? "anon"}:${courseId}:${row.week}`}
                        courseId={courseId}
                        week={row.week}
                        studentId={studentId}
                      />
                    </Section>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** สถานะเป็นภาษาไทย + สีของแต่ละ badge แบบฝึกหัด */
const PRACTICE_STATUS_META: Record<
  PracticeQuizSummary["status"],
  { label: string; className: string }
> = {
  completed: { label: "พร้อมทำ", className: "bg-emerald-50 text-emerald-700" },
  pending: { label: "กำลังสร้าง…", className: "bg-tu-gold-50 text-tu-gold-700" },
  failed: { label: "สร้างไม่สำเร็จ", className: "bg-tu-red-50 text-tu-red-600" },
};

/**
 * รายการแบบฝึกหัดเจาะจุดที่พลาดที่นักเรียนคนนี้เคยสร้างไว้จากควิซจริงชุดนี้ —
 * ดึงจาก backend ทุกครั้งที่เปิดสัปดาห์นี้ (ไม่ cache ในเครื่อง เพราะ backend
 * เป็นเจ้าของข้อมูลจริงตั้งแต่สร้าง — ดู lib/practiceQuizApi.ts)
 */
function PracticeQuizzesList({
  quizId,
  week,
  wkLabel,
  studentId,
  courseId,
}: {
  quizId: string;
  /** key สัปดาห์ภายใน ("สัปดาห์ที่ N") — ใช้ค้นประวัติฝึกซ้อมในเครื่อง (localStorage) */
  week: string;
  /** เลขสัปดาห์ล้วน — ใช้ทำลิงก์ไปหน้าทำแบบทดสอบ */
  wkLabel: string;
  studentId: string;
  courseId: string;
}) {
  const [items, setItems] = useState<PracticeQuizSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError("");
    fetchPracticeQuizzes(quizId, studentId)
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "โหลดรายการแบบฝึกหัดไม่สำเร็จ",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [quizId, studentId]);

  // ผลฝึกซ้อมเก็บในเครื่อง (localStorage) เท่านั้น — จับคู่แต่ละแบบฝึกหัดที่ backend
  // list มา กับรอบล่าสุดที่เคยทำจริงในเครื่องนี้ (เทียบด้วย quiz.id ที่ snapshot ไว้)
  const history = getPracticeHistory(studentId, courseId, week);
  function latestAttemptFor(practiceQuizId: string) {
    const matches = history.filter((h) => h.quiz.id === practiceQuizId);
    return matches.length > 0 ? matches[matches.length - 1] : null;
  }

  if (error) {
    return <p className="mt-2.5 text-xs text-tu-red-600">{error}</p>;
  }
  if (items === null) {
    return <p className="mt-2.5 text-xs text-ink-400">กำลังโหลดแบบฝึกหัด…</p>;
  }
  if (items.length === 0) return null;

  return (
    <div className="mt-2.5">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">
        <Target className="h-3 w-3" />
        แบบฝึกหัดที่คุณสร้างเอง (เจาะจุดที่พลาด)
      </p>
      <div className="flex flex-col gap-1.5">
        {items.map((p) => {
          const attempt = latestAttemptFor(p.id);
          const meta = PRACTICE_STATUS_META[p.status];
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-paper-50 px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-ink-700">
                  รอบที่ {p.attemptNumber} · {p.questionCount} ข้อ
                </p>
                {attempt ? (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    ทำแล้ว · ได้ {attempt.score}/{attempt.total} ข้อ ({attempt.percent}%)
                  </p>
                ) : (
                  <span
                    className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                )}
              </div>
              {p.status === "completed" ? (
                <Link
                  href={`/student/quiz/${wkLabel}?practiceQuizId=${p.id}`}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs ${
                    attempt ? "btn-secondary" : "btn-primary"
                  }`}
                >
                  {attempt ? "ดูผลลัพธ์ →" : "ทำ/ทบทวน →"}
                </Link>
              ) : (
                <span className="flex-shrink-0 text-xs text-ink-300">
                  {p.status === "pending" ? "รอสักครู่…" : "ลองสร้างใหม่ในหน้าผลลัพธ์"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** กล่องหัวข้อย่อยใน dropdown ของสัปดาห์ */
function Section({
  icon,
  title,
  hex,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hex: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4
        className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide"
        style={{ color: hex }}
      >
        {icon}
        {title}
      </h4>
      {children}
    </section>
  );
}

/**
 * ช่องบันทึกสรุปของนักเรียน — กรอก/ส่ง/แก้ไขได้
 * เขียนลง localStorage ก่อนทันที (UX ไว ใช้ได้แม้ backend ล่ม/เข้าไม่ถึง) แล้วค่อย
 * sync ขึ้น backend แบบ best-effort (ดู lib/notesApi.ts) — ถ้า backend มีของเดิม
 * อยู่แล้ว (เช่น เปิดจากเครื่องอื่น) จะดึงมาใช้แทนของในเครื่องนี้
 */
function WeekSummaryNote({
  storageKey,
  courseId,
  week,
  studentId,
}: {
  storageKey: string;
  courseId: string;
  week: string;
  studentId: string | null;
}) {
  const [saved, setSaved] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let v: string | null = null;
    try {
      v = localStorage.getItem(storageKey);
    } catch {
      v = null;
    }
    setSaved(v);
    setText(v ?? "");
    setEditing(!v);
    setLoaded(true);

    // best-effort ดึงจาก backend — ถ้ามีบันทึกไว้อยู่แล้ว (เช่น จากเครื่องอื่น)
    // ใช้ค่านั้นแทน ถ้า backend ล่ม/เข้าไม่ถึง/ยังไม่เคยบันทึกก็ใช้ค่าในเครื่องต่อปกติ
    if (!studentId) return;
    fetchWeekNote(courseId, week, studentId)
      .then((note) => {
        if (note.text) {
          setSaved(note.text);
          setText(note.text);
          setEditing(false);
          try {
            localStorage.setItem(storageKey, note.text);
          } catch {
            /* localStorage ไม่พร้อม — ข้าม */
          }
        } else if (v) {
          // มีบันทึกอยู่ในเครื่องนี้แล้ว แต่ backend ไม่มี — เช่นบันทึกไว้ตั้งแต่ก่อน
          // ต่อ backend เสร็จ ยิงขึ้นไปให้ backend มีตามด้วย (backfill ครั้งเดียว)
          saveWeekNote(courseId, week, studentId, v).catch((err) => {
            console.error(
              "sync บันทึกเก่าขึ้น backend ไม่สำเร็จ (ยังใช้ในเครื่องได้ปกติ)",
              err,
            );
          });
        }
      })
      .catch((err) => {
        console.error("โหลดบันทึกจาก backend ไม่สำเร็จ (ใช้ค่าในเครื่องต่อไปได้ปกติ)", err);
      });
  }, [storageKey, courseId, week, studentId]);

  function submit() {
    const t = text.trim();
    if (!t) return;
    try {
      localStorage.setItem(storageKey, t);
    } catch {
      /* localStorage ไม่พร้อม — ข้าม */
    }
    setSaved(t);
    setEditing(false);

    if (studentId) {
      saveWeekNote(courseId, week, studentId, t).catch((err) => {
        console.error("บันทึกขึ้น backend ไม่สำเร็จ (ยังบันทึกในเครื่องได้ปกติ)", err);
      });
    }
  }

  if (!loaded) return null;

  // โหมดแสดงผล (ส่งแล้ว) + ปุ่มแก้ไข
  if (!editing && saved) {
    return (
      <div className="rounded-xl border border-line bg-paper-50 p-3.5">
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-700">
          {saved}
        </p>
        <button
          type="button"
          onClick={() => {
            setText(saved);
            setEditing(true);
          }}
          className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-tu-red-600 transition hover:text-tu-red-700"
        >
          <Pencil className="h-3.5 w-3.5" />
          แก้ไข
        </button>
      </div>
    );
  }

  // โหมดกรอก/แก้ไข
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="วันนี้เรียนอะไรมาบ้าง หรือมีตรงไหนที่ยังไม่เข้าใจ…"
        className="field resize-none text-sm"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          className="btn-primary px-4 py-1.5 text-xs disabled:opacity-40"
        >
          ส่ง
        </button>
        {saved && (
          <button
            type="button"
            onClick={() => {
              setText(saved);
              setEditing(false);
            }}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            ยกเลิก
          </button>
        )}
      </div>
    </div>
  );
}
