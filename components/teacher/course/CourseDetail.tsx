"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCourse, topicsFromSyllabusSchedule } from "@/lib/courseStore";
import { weekNumber } from "@/lib/weeks";
import { extractSyllabus } from "@/lib/syllabus";
import PageHeader from "@/components/ui/PageHeader";
import type { Topic } from "@/lib/types";
import type { Quiz } from "@/lib/quiz";

interface WeekRow {
  week: string;
  topics: Topic[];
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
        <div className="border-t border-line-soft">
          {rows.map((row) => {
            const wk = weekNumber(row.week);
            const open = expandedWeek === row.week;
            const hasQuizzes = row.quizzes.length > 0;

            // หัวสัปดาห์ — WEEK + เลขสัปดาห์ + จำนวนแบบทดสอบ + หัวข้อ
            const WeekMain = (
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-tu-red-600">
                    Week
                  </span>
                  <span className="text-xl font-bold leading-none text-ink-900">
                    {wk}
                  </span>
                  <span className="text-xs text-ink-400">
                    {hasQuizzes
                      ? `· ${row.quizzes.length} แบบทดสอบ`
                      : "· ยังไม่มีแบบทดสอบ"}
                  </span>
                </div>
                <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-ink-600">
                  {row.topics.map((t) => t.title).join("  ·  ")}
                </p>
              </div>
            );

            // ลิงก์สร้างควิซ — ขีดเส้นใต้ขยายตอน hover + เครื่องหมาย + หมุนเล็กน้อย
            const createLink = (label: string) => (
              <Link
                href={`/quiz/${wk}?new=1`}
                className="group/create inline-flex items-center gap-1 text-[13px] font-semibold text-tu-red-600 transition-colors hover:text-tu-red-700"
              >
                <span className="inline-block transition-transform duration-200 group-hover/create:rotate-90 group-hover/create:scale-110">
                  +
                </span>
                <span className="underline decoration-1 underline-offset-4 transition-all duration-200 group-hover/create:underline-offset-[6px]">
                  {label}
                </span>
              </Link>
            );

            return (
              <div key={row.week} className="border-b border-line-soft">
                {hasQuizzes ? (
                  /* สัปดาห์ที่มีควิซ — กดหัวเพื่อกาง/พับตารางควิซ */
                  <button
                    type="button"
                    onClick={() => setExpandedWeek(open ? null : row.week)}
                    aria-expanded={open}
                    className="flex w-full items-start gap-4 px-1.5 py-5 text-left"
                  >
                    {WeekMain}
                    <span className="flex flex-shrink-0 items-center self-center">
                      <svg
                        className={`h-[18px] w-[18px] text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.4}
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                ) : (
                  /* สัปดาห์ที่ยังไม่มีควิซ — ปุ่มสร้างควิซแทน dropdown */
                  <div className="flex w-full items-start gap-4 px-1.5 py-5">
                    {WeekMain}
                    <span className="flex flex-shrink-0 items-center self-center">
                      {createLink("สร้างควิซ")}
                    </span>
                  </div>
                )}

                {/* dropdown = ตารางย่อยจากสัปดาห์ (เยื้องเข้า + เส้นเชื่อมซ้าย, ไม่มีพื้นกล่อง) */}
                {open && hasQuizzes && (
                  <div className="px-1.5 pb-5">
                    <div className="relative ml-[30px] border-l-2 border-line-soft pl-6 before:absolute before:left-0 before:top-5 before:h-0.5 before:w-4 before:bg-line-soft">
                      {/* หัวตาราง */}
                      <div className="grid grid-cols-[1fr_84px_128px] items-center gap-3.5 border-b border-line-soft px-1 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                        <div>แบบทดสอบ</div>
                        <div className="text-center">จำนวนข้อ</div>
                        <div className="text-right">จัดการ</div>
                      </div>

                      {/* แถวควิซ */}
                      {row.quizzes.map((q) => (
                        <div
                          key={q.id}
                          className="grid grid-cols-[1fr_84px_128px] items-center gap-3.5 border-t border-line-soft px-1 py-2.5 transition-colors first:border-t-0 hover:bg-paper-200/40"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {/* ปุ่มเลือกชุดที่ใช้งาน (active ได้ทีละชุดต่อสัปดาห์) */}
                            <button
                              type="button"
                              onClick={() => toggleQuizActive(row.week, q.id)}
                              title={q.isActive ? "ชุดที่ใช้งานอยู่" : "ตั้งเป็นชุดที่ใช้งาน"}
                              aria-pressed={q.isActive}
                              className={`grid h-[19px] w-[19px] flex-shrink-0 place-items-center rounded-full border-2 transition ${
                                q.isActive
                                  ? "border-tu-red-500 bg-tu-red-500"
                                  : "border-line-strong bg-white hover:border-tu-red-400"
                              }`}
                            >
                              {q.isActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <span
                                className={`block truncate text-[13.5px] font-semibold ${
                                  q.isActive ? "text-tu-red-600" : "text-ink-800"
                                }`}
                              >
                                {q.title}
                              </span>
                              {q.isActive && (
                                <span className="mt-0.5 inline-flex items-center gap-1 rounded border border-tu-red-100 bg-tu-red-50 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-tu-red-700">
                                  <span className="h-1 w-1 rounded-full bg-tu-red-500" />
                                  เลือกอยู่
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-center text-[13.5px] font-semibold tabular-nums text-ink-700">
                            {q.questions.length}
                          </div>

                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/quiz/${wk}?quiz=${q.id}`}
                              className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-ink-600 transition hover:border-line-strong hover:text-tu-red-600"
                            >
                              แก้ไข
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(row.week, q)}
                              className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-ink-400 transition hover:border-tu-red-200 hover:bg-tu-red-50/40 hover:text-tu-red-600"
                            >
                              ลบ
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* สร้างควิซเพิ่ม */}
                      <div className="pt-3.5">{createLink("สร้างควิซเพิ่ม")}</div>
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
