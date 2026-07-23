"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCourse, topicsFromSyllabusSchedule } from "@/lib/courseStore";
import { resolveHex, weekNumber } from "@/lib/weeks";
import { extractSyllabus } from "@/lib/syllabus";
import PageHeader from "@/components/ui/PageHeader";
import type { Topic } from "@/lib/types";
import type { Quiz } from "@/lib/quiz";

interface WeekRow {
  week: string;
  topics: Topic[];
  colorKey: string;
  quizzes: Quiz[];
}

/**
 * หน้ารายละเอียดของ 1 วิชา — สัปดาห์ที่จัดหัวข้อแล้ว + สถานะแบบทดสอบ
 * ตั้งวิชานี้เป็น "active" เพื่อให้หน้าจัดหัวข้อ/สร้างควิซทำงานกับวิชาที่ถูกต้อง
 */
export default function CourseDetail({ courseId }: { courseId: string }) {
  const {
    courses,
    getCourse,
    setActiveCourse,
    activeCourseId,
    setSyllabus,
    setSyllabusExtraction,
    setTopics,
    toggleQuizActive,
    deleteQuiz,
    hydrated,
  } = useCourse();

  const course = getCourse(courseId);
  const syllabusRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  // สัปดาห์ที่กางรายการควิซอยู่ (accordion) — เก็บเป็นป้ายสัปดาห์
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  // ตั้งวิชานี้เป็น active เมื่อเข้าหน้า (ให้ /topics, /quiz ทำงานกับวิชานี้)
  useEffect(() => {
    if (course && activeCourseId !== courseId) setActiveCourse(courseId);
  }, [course, courseId, activeCourseId, setActiveCourse]);

  function onPickSyllabus(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setSyllabus(file.name, reader.result as string);
    reader.readAsDataURL(file);

    setExtractError("");
    setExtracting(true);
    extractSyllabus(file)
      .then((extraction) => {
        setSyllabusExtraction(extraction);
        // เปลี่ยนไฟล์ syllabus ใหม่ = จัดหัวข้อใหม่ทั้งชุดตามตารางสอนที่แกะได้
        // (ของเดิมถูกทิ้ง — ถ้าแกะไม่ได้อะไรเลยก็คงหัวข้อเดิมไว้ ไม่ล้างทิ้งเปล่าๆ)
        const newTopics = topicsFromSyllabusSchedule(extraction, file.name);
        if (newTopics.length > 0) setTopics(newTopics);
      })
      .catch(() =>
        setExtractError("แยกข้อมูลจาก syllabus ไม่สำเร็จ ลองแนบไฟล์ใหม่อีกครั้ง"),
      )
      .finally(() => setExtracting(false));
  }

  const rows = useMemo<WeekRow[]>(() => {
    if (!course) return [];
    const map = new Map<string, Topic[]>();
    for (const t of course.topics) {
      if (!t.weekAssigned) continue;
      const list = map.get(t.weekAssigned) ?? [];
      list.push(t);
      map.set(t.weekAssigned, list);
    }
    return Array.from(map.entries())
      .map(([week, list]) => ({
        week,
        topics: list,
        colorKey: course.weekConfig[week]?.colorKey ?? "red",
        quizzes: course.quizzes[week] ?? [],
      }))
      .sort((a, b) => Number(weekNumber(a.week)) - Number(weekNumber(b.week)));
  }, [course]);

  if (!hydrated) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  // เผื่อ id ไม่ตรงกับวิชาใด (เช่นถูกลบไปแล้ว)
  if (!course) {
    return (
      <div className="card-empty">
        <h2 className="display text-lg">ไม่พบรายวิชานี้</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
          รายวิชาอาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง
        </p>
        <Link href="/course" className="btn-primary mt-5">
          ← กลับไปหน้ารายวิชา
        </Link>
      </div>
    );
  }

  const unassigned = course.topics.filter((t) => !t.weekAssigned).length;

  function handleDelete(week: string, quiz: Quiz) {
    if (
      confirm(
        `ลบ "${quiz.title}" ออกจาก ${week}?\nการลบนี้ย้อนกลับไม่ได้`,
      )
    ) {
      deleteQuiz(week, quiz.id);
    }
  }

  return (
    <div>
      {/* breadcrumb กลับไปหน้ารายวิชาทั้งหมด */}
      <Link
        href="/course"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 transition hover:text-tu-red-600"
      >
        ← รายวิชาทั้งหมด
        {courses.length > 1 && (
          <span className="text-ink-400"> ({courses.length} วิชา)</span>
        )}
      </Link>

      <PageHeader
        eyebrow="รายละเอียดรายวิชา"
        title={course.subject}
        action={
          <>
            <Link href="/upload" className="btn-secondary">
              + อัปโหลดสไลด์
            </Link>
            <Link href="/topics" className="btn-primary">
              จัดหัวข้อรายสัปดาห์
            </Link>
          </>
        }
      />

      {/* แถบไฟล์ syllabus */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-tu-red-50 text-tu-red-600">
            <DocIcon />
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
              {course.syllabusName ?? "ยังไม่ได้แนบไฟล์"}
            </p>
            {extracting && (
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-400">
                <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-line-strong border-t-tu-red-500" />
                กำลังแยก CLO และตารางสอน…
              </p>
            )}
            {extractError && (
              <p className="mt-0.5 text-[11px] text-tu-red-600">
                {extractError}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 text-xs">
          {course.syllabusData && (
            <a
              href={course.syllabusData}
              download={course.syllabusName ?? "course-syllabus.pdf"}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              ดาวน์โหลด
            </a>
          )}
          <button
            type="button"
            onClick={() => syllabusRef.current?.click()}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            {course.syllabusData ? "เปลี่ยนไฟล์" : "แนบไฟล์"}
          </button>
          <input
            ref={syllabusRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={onPickSyllabus}
          />
        </div>
      </div>

      {/* ผลลัพธ์การเรียนรู้ (CLO) ที่แกะได้จาก syllabus */}
      {course.clos.length > 0 && (
        <div className="mb-6 card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line-soft px-4 py-3 sm:px-5">
            <h2 className="text-sm font-bold text-ink-800">
              ผลลัพธ์การเรียนรู้ (CLO)
            </h2>
            <span className="text-[11px] text-ink-400">
              {course.clos.length} ข้อ
            </span>
          </div>
          <ul className="divide-y divide-line-soft">
            {course.clos.map((clo) => (
              <li key={clo.code} className="flex gap-3 px-4 py-3 sm:px-5">
                <span className="h-fit flex-shrink-0 rounded-full bg-tu-gold-50 px-2 py-0.5 text-[10px] font-bold text-tu-gold-700 ring-1 ring-tu-gold-200">
                  {clo.code}
                </span>
                <p className="text-xs leading-relaxed text-ink-600">
                  {clo.description ?? (
                    <span className="italic text-ink-400">
                      ไม่มีคำอธิบายในเอกสาร
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* รายการสัปดาห์ */}
      {rows.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่ได้จัดหัวข้อเข้าสัปดาห์</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            {unassigned > 0
              ? `มี ${unassigned} หัวข้อรอจัดเข้าสัปดาห์ ไปที่หน้า “จัดหัวข้อ” เพื่อเลือกหัวข้อเข้าสัปดาห์ก่อน`
              : "อัปโหลดสไลด์เพื่อให้ระบบช่วยแยกหัวข้อ แล้วจึงจัดเข้าสัปดาห์"}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/upload" className="btn-secondary">
              + อัปโหลดสไลด์
            </Link>
            <Link href="/topics" className="btn-primary">
              ไปจัดหัวข้อ
            </Link>
          </div>
        </div>
      ) : (
        <div className="card divide-y divide-line-soft overflow-hidden">
          {rows.map((row) => {
            const wk = weekNumber(row.week);
            const open = expandedWeek === row.week;
            const hasQuizzes = row.quizzes.length > 0;

            const HeaderContent = (
              <>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span
                    className="h-10 w-1 rounded-full"
                    style={{ backgroundColor: resolveHex(row.colorKey) }}
                    aria-hidden
                  />
                  <span className="w-7 text-2xl font-bold leading-none text-ink-300 transition group-hover:text-ink-500">
                    {wk}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink-800">
                      {row.week}
                    </span>
                    <span className="text-[11px] text-ink-400">
                      {row.topics.length} หัวข้อ
                    </span>
                    {hasQuizzes ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tu-gold-50 px-2.5 py-0.5 text-[10px] font-bold text-tu-gold-700 ring-1 ring-tu-gold-200">
                        <svg className="h-3 w-3 text-tu-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>ควิซ {row.quizzes.length} ชุด</span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-paper-200 px-2 py-0.5 text-[10px] font-medium text-ink-500">
                        ยังไม่มีควิซ
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs leading-relaxed text-ink-500">
                    {row.topics.map((t) => t.title).join("  ·  ")}
                  </p>
                </div>
              </>
            );

            return (
              <div key={row.week}>
                {hasQuizzes ? (
                  /* หัวแถวสัปดาห์ — กดเพื่อกาง/พับรายการควิซ (สำหรับสัปดาห์ที่มีควิซ) */
                  <button
                    type="button"
                    onClick={() => setExpandedWeek(open ? null : row.week)}
                    aria-expanded={open}
                    className="group flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-paper-100/70 sm:px-5"
                  >
                    {HeaderContent}
                    <svg
                      className={`h-4 w-4 flex-shrink-0 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  /* แถวสัปดาห์ทั่วไปแบบไม่มีควิซ — แสดงลิงก์สร้างควิซแทนปุ่ม Dropdown */
                  <div className="flex w-full items-center gap-4 px-4 py-4 sm:px-5">
                    {HeaderContent}
                    <Link
                      href={`/quiz/${wk}?new=1`}
                      className="group/create inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-tu-red-600 transition-colors hover:text-tu-red-700"
                    >
                      <span className="inline-block transition-transform duration-200 group-hover/create:rotate-90 group-hover/create:scale-125">
                        +
                      </span>
                      <span className="underline decoration-1 underline-offset-4 transition-all duration-200 group-hover/create:underline-offset-[6px]">
                        สร้างควิซ
                      </span>
                    </Link>
                  </div>
                )}

                {/* แผงรายการควิซของสัปดาห์นี้ — จัดตำแหน่งให้เยื้องเข้าและมีเส้นเชื่อมโยงทางซ้าย (Tree Branch style) */}
                {open && hasQuizzes && (
                  <div className="bg-paper-50/30 pb-4 pt-1 px-4 sm:px-5">
                    <div className="ml-10 pl-6 border-l-2 border-line-soft">
                      <ul className="divide-y divide-line-soft">
                        {row.quizzes.map((q) => (
                          <li
                            key={q.id}
                            className="flex items-center justify-between gap-4 py-3"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* ปุ่มเลือกชุดที่ใช้งาน (active ได้ทีละชุด) */}
                              <button
                                type="button"
                                onClick={() => toggleQuizActive(row.week, q.id)}
                                title={q.isActive ? "ชุดที่ใช้งานอยู่" : "ตั้งเป็นชุดที่ใช้งาน"}
                                aria-pressed={q.isActive}
                                className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-2 transition ${
                                  q.isActive
                                    ? "border-tu-red-500 bg-tu-red-500 text-white"
                                    : "border-line-strong hover:border-tu-red-400 bg-white"
                                }`}
                              >
                                {q.isActive && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                )}
                              </button>

                              <div className="min-w-0">
                                <p className="flex items-center gap-2 text-sm font-semibold text-ink-800">
                                  <span className="min-w-0 truncate">{q.title}</span>
                                  {/* render ไว้ตลอดแล้วซ่อนด้วย invisible เพื่อไม่ให้ layout ขยับตอนสลับ active */}
                                  <span
                                    aria-hidden={!q.isActive}
                                    className={`inline-flex shrink-0 items-center gap-1 rounded bg-tu-red-50 px-2 py-0.5 text-[9px] font-bold tracking-wide text-tu-red-700 uppercase ${
                                      q.isActive ? "" : "invisible"
                                    }`}
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-tu-red-500 animate-pulse" />
                                    เลือกอยู่
                                  </span>
                                </p>
                                <p className="text-[11px] text-ink-400 mt-0.5">
                                  จำนวน {q.questions.length} ข้อ
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Link
                                href={`/quiz/${wk}?quiz=${q.id}`}
                                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-ink-600 bg-white border border-line hover:border-line-strong hover:text-tu-red-600 transition"
                              >
                                แก้ไข
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDelete(row.week, q)}
                                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-ink-400 bg-white border border-line hover:border-tu-red-200 hover:text-tu-red-600 hover:bg-tu-red-50/20 transition"
                              >
                                ลบ
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3 flex">
                        <Link
                          href={`/quiz/${wk}?new=1`}
                          className="group/create inline-flex items-center gap-1 text-xs font-semibold text-tu-red-600 transition-colors hover:text-tu-red-700"
                        >
                          <span className="inline-block transition-transform duration-200 group-hover/create:rotate-90 group-hover/create:scale-125">
                            +
                          </span>
                          <span className="underline decoration-1 underline-offset-4 transition-all duration-200 group-hover/create:underline-offset-[6px]">
                            สร้างควิซเพิ่ม
                          </span>
                        </Link>
                      </div>
                    </div>
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

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-2xl font-bold leading-none text-ink-900">{value}</p>
      <p className="mt-1.5 text-[11px] font-medium text-ink-500">{label}</p>
    </div>
  );
}

function DocIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}
