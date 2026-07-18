"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { useCourse } from "@/lib/courseStore";
import { resolveHex, weekNumber } from "@/lib/weeks";
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
      <div className="grid place-items-center py-24 text-sm text-slate-400">
        กำลังโหลด…
      </div>
    );
  }

  // เริ่มรายวิชาแล้วหรือยัง (มีชื่อวิชา หรือมีสัปดาห์ที่จัดหัวข้อไว้)
  const started = subject.trim() !== "" || rows.length > 0;

  return (
    <div className="space-y-5">
      {/* หัวรายวิชา */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-tu-red-500">
          ภาพรวมรายวิชา
        </p>
        <h1 className="mt-0.5 text-2xl font-bold text-slate-800">
          {subject || "ยังไม่มีรายวิชา"}
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          {rows.length} สัปดาห์ที่จัดแล้ว ·{" "}
          {topics.filter((t) => t.weekAssigned).length} หัวข้อ
        </p>

        {/* ปุ่มในการ์ดนี้แสดงเฉพาะเมื่อเริ่มรายวิชาแล้ว — ถ้ายังไม่มีให้ใช้ปุ่มเดียวที่การ์ด "เริ่มต้นสร้างรายวิชา" ด้านล่าง */}
        {started && (
          <div className="mt-4 space-y-3">
            {/* course syllabus — ดาวน์โหลด/อัปโหลดไฟล์ แยกจากเอกสารการสอน */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {syllabusData ? (
                <>
                  <a
                    href={syllabusData}
                    download={syllabusName ?? "course-syllabus.pdf"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-200"
                  >
                    <DownloadIcon />
                    ดาวน์โหลด course syllabus
                  </a>
                  <button
                    type="button"
                    onClick={() => syllabusRef.current?.click()}
                    className="font-semibold text-slate-400 transition hover:text-tu-red-600"
                  >
                    เปลี่ยนไฟล์
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => syllabusRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  <UploadIcon />
                  อัปโหลด course syllabus
                </button>
              )}
              <input
                ref={syllabusRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={onPickSyllabus}
              />
            </div>

            {/* การกระทำหลัก */}
            <div className="flex flex-wrap gap-2">
              <Link
                href="/topics"
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                จัดหัวข้อรายสัปดาห์
              </Link>
              <Link
                href="/upload"
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                + อัปโหลดเอกสารใหม่
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* รายการสัปดาห์ */}
      {rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
          {started ? (
            <>
              <p className="text-sm font-semibold text-slate-600">
                ยังไม่ได้จัดหัวข้อเข้าสัปดาห์
              </p>
              <p className="mt-1 text-xs text-slate-400">
                ไปที่หน้า “จัดหัวข้อรายสัปดาห์” เพื่อเลือกหัวข้อเข้าสัปดาห์ก่อน
                แล้วค่อยกลับมาสร้างควิซ
              </p>
              <Link
                href="/topics"
                className="mt-4 inline-block rounded-xl bg-tu-red-500 px-5 py-2 text-xs font-bold text-white transition hover:bg-tu-red-600"
              >
                ไปจัดหัวข้อ
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-600">
                เริ่มต้นสร้างรายวิชา
              </p>
              <p className="mt-1 text-xs text-slate-400">
                โปรดอัปโหลดเอกสารการสอน (PDF) เพื่อให้ระบบวิเคราะห์และจำแนกหัวข้อโดยอัตโนมัติ
              </p>
              <Link
                href="/upload"
                className="mt-4 inline-block rounded-xl bg-tu-red-500 px-5 py-2 text-xs font-bold text-white transition hover:bg-tu-red-600"
              >
                อัปโหลดเอกสารการสอน
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100 bg-white">
          {rows.map((row) => {
            const hasQuiz = row.questionCount !== null;
            return (
              <div
                key={row.week}
                className="flex flex-col gap-1.5 px-5 py-4 transition hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: resolveHex(row.colorKey) }}
                    />
                    <span className="text-sm font-bold text-slate-700">
                      {row.week}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {row.topics.length} หัวข้อ
                    </span>
                  </div>
                  <p className="mt-1 pl-[18px] text-xs leading-relaxed text-slate-400">
                    {row.topics.map((t) => t.title).join("  ·  ")}
                  </p>
                </div>

                <Link
                  href={`/quiz/${weekNumber(row.week)}`}
                  className={`shrink-0 self-start pl-[18px] text-xs font-bold transition sm:self-center sm:pl-0 ${
                    hasQuiz
                      ? "text-slate-500 hover:text-slate-700"
                      : "text-tu-red-600 hover:text-tu-red-700"
                  }`}
                >
                  {hasQuiz ? "ดู / แก้ควิซ →" : "＋ สร้างควิซ →"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
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

function UploadIcon() {
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
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 16V4m0 0L8 8m4-4l4 4"
      />
    </svg>
  );
}
