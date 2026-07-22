"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useCourse } from "@/lib/courseStore";
import { resolveHex, weekNumber } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";
import type { Topic } from "@/lib/types";

interface WeekRow {
  week: string;
  topics: Topic[];
  colorKey: string;
  questionCount: number | null;
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
    hydrated,
  } = useCourse();

  const course = getCourse(courseId);
  const syllabusRef = useRef<HTMLInputElement>(null);

  // ตั้งวิชานี้เป็น active เมื่อเข้าหน้า (ให้ /topics, /quiz ทำงานกับวิชานี้)
  useEffect(() => {
    if (course && activeCourseId !== courseId) setActiveCourse(courseId);
  }, [course, courseId, activeCourseId, setActiveCourse]);

  function onPickSyllabus(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSyllabus(file.name, reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
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
        questionCount: course.quizzes[week]?.questions.length ?? null,
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

  const assignedCount = course.topics.filter((t) => t.weekAssigned).length;
  const quizCount = rows.filter((r) => r.questionCount !== null).length;
  const unassigned = course.topics.filter((t) => !t.weekAssigned).length;

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
            </p>
            <p className="truncate text-sm font-medium text-ink-700">
              {course.syllabusName ?? "ยังไม่ได้แนบไฟล์"}
            </p>
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
            const hasQuiz = row.questionCount !== null;
            return (
              <Link
                key={row.week}
                href={`/quiz/${weekNumber(row.week)}`}
                className="group flex items-center gap-4 px-4 py-4 transition hover:bg-paper-100/70 sm:px-5"
              >
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span
                    className="h-10 w-1 rounded-full"
                    style={{ backgroundColor: resolveHex(row.colorKey) }}
                    aria-hidden
                  />
                  <span className="w-7 text-2xl font-bold leading-none text-ink-300 transition group-hover:text-ink-500">
                    {weekNumber(row.week)}
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
                    {hasQuiz && (
                      <span className="rounded-full bg-tu-gold-50 px-2 py-0.5 text-[10px] font-bold text-tu-gold-700 ring-1 ring-tu-gold-200">
                        ควิซ {row.questionCount} ข้อ
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs leading-relaxed text-ink-500">
                    {row.topics.map((t) => t.title).join("  ·  ")}
                  </p>
                </div>

                <span
                  className={`flex-shrink-0 text-xs font-bold transition ${
                    hasQuiz
                      ? "text-ink-400 group-hover:text-ink-700"
                      : "text-tu-red-600 group-hover:text-tu-red-700"
                  }`}
                >
                  {hasQuiz ? "แก้ไข →" : "＋ สร้างควิซ"}
                </span>
              </Link>
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
