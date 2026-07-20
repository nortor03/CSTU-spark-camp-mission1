"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
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
 * หน้าภาพรวมรายวิชา (บ้านหลัก)
 * โชว์วิชา + สัปดาห์ที่มีหัวข้อ พร้อมปุ่มสร้าง/แก้ควิซรายสัปดาห์
 */
export default function CourseHub() {
  const {
    subject,
    syllabusName,
    syllabusData,
    setSyllabus,
    topics,
    weekConfig,
    quizzes,
    hydrated,
  } = useCourse();

  const syllabusRef = useRef<HTMLInputElement>(null);

  /** เลือกไฟล์ course syllabus ใหม่ → อ่านเป็น data URL แล้วเก็บลง store */
  function onPickSyllabus(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSyllabus(file.name, reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const rows = useMemo<WeekRow[]>(() => {
    const map = new Map<string, Topic[]>();
    for (const t of topics) {
      if (!t.weekAssigned) continue;
      const list = map.get(t.weekAssigned) ?? [];
      list.push(t);
      map.set(t.weekAssigned, list);
    }
    return Array.from(map.entries())
      .map(([week, list]) => ({
        week,
        topics: list,
        colorKey: weekConfig[week]?.colorKey ?? "red",
        questionCount: quizzes[week]?.questions.length ?? null,
      }))
      .sort((a, b) => Number(weekNumber(a.week)) - Number(weekNumber(b.week)));
  }, [topics, weekConfig, quizzes]);

  if (!hydrated) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  // เริ่มรายวิชาแล้วหรือยัง (มีชื่อวิชา หรือมีสัปดาห์ที่จัดหัวข้อไว้)
  const started = subject.trim() !== "" || rows.length > 0;
  const assignedCount = topics.filter((t) => t.weekAssigned).length;
  const quizCount = rows.filter((r) => r.questionCount !== null).length;

  return (
    <div>
      <PageHeader
        eyebrow="ภาพรวมรายวิชา"
        title={subject || "ยังไม่มีรายวิชา"}
        subtitle={
          started
            ? "ภาพรวมของหัวข้อที่จัดเข้าสัปดาห์แล้ว และสถานะแบบทดสอบของแต่ละสัปดาห์"
            : undefined
        }
        action={
          started ? (
            <>
              <Link href="/upload" className="btn-secondary">
                อัปโหลดเอกสาร
              </Link>
              <Link href="/topics" className="btn-primary">
                จัดหัวข้อรายสัปดาห์
              </Link>
            </>
          ) : undefined
        }
      />

      {started && (
        <>
          {/* ---------- ตัวเลขสรุป ---------- */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Stat value={rows.length} label="สัปดาห์ที่จัดแล้ว" />
            <Stat value={assignedCount} label="หัวข้อ" />
            <Stat value={quizCount} label="แบบทดสอบ" />
          </div>

          {/* ---------- แถบไฟล์ syllabus ---------- */}
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
                  {syllabusName ?? "ยังไม่ได้แนบไฟล์"}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2 text-xs">
              {syllabusData && (
                <a
                  href={syllabusData}
                  download={syllabusName ?? "course-syllabus.pdf"}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  <DownloadIcon />
                  ดาวน์โหลด
                </a>
              )}
              <button
                type="button"
                onClick={() => syllabusRef.current?.click()}
                className="btn-ghost px-3 py-1.5 text-xs"
              >
                {syllabusData ? "เปลี่ยนไฟล์" : "แนบไฟล์"}
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
        </>
      )}

      {/* ---------- รายการสัปดาห์ ---------- */}
      {rows.length === 0 ? (
        <div className="card-empty">
          {started ? (
            <>
              <h2 className="display text-lg">ยังไม่ได้จัดหัวข้อเข้าสัปดาห์</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
                ไปที่หน้า “จัดหัวข้อ” เพื่อเลือกหัวข้อเข้าสัปดาห์ก่อน
                แล้วค่อยกลับมาสร้างแบบทดสอบ
              </p>
              <Link href="/topics" className="btn-primary mt-5">
                ไปจัดหัวข้อ
              </Link>
            </>
          ) : (
            <>
              <p className="eyebrow">เริ่มต้นใช้งาน</p>
              <h2 className="display mt-1.5 text-xl">เริ่มต้นสร้างรายวิชา</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
                อัปโหลดเอกสารการสอน (PDF)
                เพื่อให้ระบบวิเคราะห์และจำแนกหัวข้อโดยอัตโนมัติ
              </p>
              <Link href="/upload" className="btn-primary mt-5">
                อัปโหลดเอกสารการสอน
              </Link>
            </>
          )}
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
                {/* เลขสัปดาห์ตัวใหญ่ + แถบสีประจำสัปดาห์ */}
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span
                    className="h-10 w-1 rounded-full"
                    style={{ backgroundColor: resolveHex(row.colorKey) }}
                    aria-hidden
                  />
                  <span className="display w-7 text-2xl leading-none text-ink-300 transition group-hover:text-ink-500">
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

/** กล่องตัวเลขสรุป 1 ช่อง */
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="card px-4 py-3">
      <p className="display text-2xl leading-none">{value}</p>
      <p className="mt-1.5 text-[11px] font-medium text-ink-500">{label}</p>
    </div>
  );
}

/* ---------- ไอคอน ---------- */

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

function DownloadIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4"
      />
    </svg>
  );
}
