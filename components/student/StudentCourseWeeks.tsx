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
} from "lucide-react";
import type { Quiz } from "@/lib/quiz";

interface WeekRow {
  week: string;
  topics: string[];
  files: string[];
  activeQuiz: Quiz | null;
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
                    <p className="mt-1 text-xs text-ink-400">
                      {hasQuiz ? "มีแบบทดสอบ" : "ยังไม่มีแบบทดสอบ"}
                    </p>
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

                    {/* 2. เอกสารประกอบ (ดาวน์โหลด) */}
                    <Section icon={<FileText className="h-4 w-4" />} title="เอกสารประกอบ" hex={hex}>
                      {row.files.length === 0 ? (
                        <p className="text-[13px] text-ink-400">
                          ยังไม่มีเอกสารสำหรับสัปดาห์นี้
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {row.files.map((f) => (
                            <li
                              key={f}
                              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2"
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <FileText className="h-4 w-4 flex-shrink-0 text-tu-red-500" />
                                <span className="truncate text-[13px] text-ink-700">
                                  {f}
                                </span>
                              </span>
                              {/* หมายเหตุ: prototype เก็บไฟล์จริงแค่ syllabus — ใช้เป็นไฟล์ดาวน์โหลด
                                  แทนสไลด์รายสัปดาห์ไปก่อน จนกว่าจะเก็บ data ของสไลด์แต่ละไฟล์ */}
                              {course.syllabusData ? (
                                <a
                                  href={course.syllabusData}
                                  download={f}
                                  className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-tu-red-600 transition hover:text-tu-red-700"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  ดาวน์โหลด
                                </a>
                              ) : (
                                <span className="flex-shrink-0 text-xs text-ink-300">
                                  ไม่มีไฟล์
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
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
                            <p className="mt-0.5 text-xs text-ink-400">
                              {row.activeQuiz.questions.length} ข้อ
                            </p>
                          </div>
                          <Link
                            href={`/student/quiz/${wk}`}
                            className="btn-primary flex-shrink-0 px-4 py-2 text-xs"
                          >
                            เริ่มทำ →
                          </Link>
                        </div>
                      </Section>
                    )}

                    {/* 4. บันทึกสรุป (นักเรียนกรอกเอง) */}
                    <Section icon={<MessageSquare className="h-4 w-4" />} title="บันทึกสรุป / สิ่งที่ยังไม่เข้าใจ" hex={hex}>
                      <WeekSummaryNote
                        storageKey={`tonlabkit:note:${studentId ?? "anon"}:${courseId}:${row.week}`}
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

/** ช่องบันทึกสรุปของนักเรียน — กรอก/ส่ง/แก้ไขได้ (เก็บใน localStorage) */
function WeekSummaryNote({ storageKey }: { storageKey: string }) {
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
  }, [storageKey]);

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
