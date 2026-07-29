"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WEAK_BELOW } from "@/lib/analytics";
import { TAG_COLORS } from "@/lib/weeks";
import {
  ChevronRight,
  ChevronLeft,
  Download,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  History,
} from "lucide-react";

const PAGE_SIZE = 8;

/** แถวข้อมูลนักศึกษา 1 คน รวมผลทุกสัปดาห์ที่ทำแล้ว — คำนวณจากข้อมูลจริงทั้งหมด ไม่มีค่าจำลอง */
export interface StudentAggRow {
  studentId: string;
  studentName: string;
  isCurrentUser: boolean;
  avgPercent: number;
  weeksDone: number;
  /** เปอร์เซ็นต์ CLO จริงต่อคน (จากคำตอบจริงของคนนั้น) — อาจไม่ครบทุก CLO ถ้าไม่มีคำถามผูกไว้ */
  cloPercents: { code: string; percent: number }[];
  /** สัปดาห์ล่าสุดที่คนนี้ทำแบบทดสอบ — ใช้พาไปหน้าสรุปรายบุคคล */
  latestWkNum: string;
}

/**
 * ตารางสรุปรายบุคคลรวมทั้งวิชา — คู่กับ SubmissionsTable ของหน้ารายสัปดาห์
 * ต่างกันตรงที่นี่เป็นข้อมูลจริงล้วน (ไม่มี CLO/ฝึกซ้อมจำลองแบบ hash เหมือนตารางรายสัปดาห์)
 * ฝึกซ้อมแสดงจำนวนจริงได้เฉพาะแถวของผู้ใช้ปัจจุบัน (เพื่อนร่วมชั้นจำลองไม่มีข้อมูลฝึกซ้อมจริงให้อ่าน เพราะเก็บใน localStorage ต่อเครื่อง)
 */
export default function StudentOverallTable({
  rows,
  cloCodes,
  courseSubject,
  currentUserPracticeCount,
  courseId,
}: {
  rows: StudentAggRow[];
  cloCodes: string[];
  courseSubject: string;
  currentUserPracticeCount: number | null;
  courseId: string;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | "pass" | "fail">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => [...rows].sort((a, b) => a.avgPercent - b.avgPercent), [rows]);
  const filtered = useMemo(() => {
    if (statusFilter === "pass") return sorted.filter((r) => r.avgPercent >= WEAK_BELOW);
    if (statusFilter === "fail") return sorted.filter((r) => r.avgPercent < WEAK_BELOW);
    return sorted;
  }, [sorted, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, rows.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function exportCsv() {
    const header = ["รหัส", "ชื่อ", "คะแนนเฉลี่ย", "สัปดาห์ที่ทำ", ...cloCodes, "ฝึกซ้อม (รวม)"];
    const lines = filtered.map((r) =>
      [
        r.studentId,
        r.studentName,
        `${r.avgPercent}%`,
        r.weeksDone,
        ...cloCodes.map((code) => {
          const c = r.cloPercents.find((x) => x.code === code);
          return c ? `${c.percent}%` : "-";
        }),
        r.isCurrentUser && currentUserPracticeCount != null ? currentUserPracticeCount : "-",
      ].join(","),
    );
    const csv = "﻿" + [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `สรุปรายบุคคล-${courseSubject.replace(/\s+/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="display text-xl sm:text-2xl font-bold tracking-tight text-ink-900">
            สรุปรายบุคคลทั้งวิชา
          </h2>
          <p className="mt-1 text-sm text-ink-500">รวมผลทุกสัปดาห์ที่แต่ละคนทำแล้ว</p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="relative">
            <button type="button" onClick={() => setFilterOpen((v) => !v)} className="btn-secondary">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              กรอง
              {filterOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full z-10 mt-1.5 w-40 overflow-hidden rounded-lg border border-line bg-white shadow-lift">
                {(
                  [
                    { key: "all", label: "ทั้งหมด" },
                    { key: "pass", label: "เฉลี่ยผ่านเกณฑ์" },
                    { key: "fail", label: "เฉลี่ยไม่ผ่านเกณฑ์" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(opt.key);
                      setFilterOpen(false);
                    }}
                    className={`block w-full px-3.5 py-2 text-left text-sm transition hover:bg-paper-100 ${
                      statusFilter === opt.key ? "font-semibold text-tu-red-600" : "text-ink-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="button" onClick={exportCsv} className="btn-primary">
            <Download className="h-3.5 w-3.5" />
            ส่งออก CSV
          </button>
        </div>
      </div>

      <hr className="rule-gold my-4" />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b-2 border-line text-left text-[11px] font-bold uppercase tracking-wider text-ink-500 bg-paper-50">
              <th className="whitespace-nowrap pb-3 pt-3 pl-3">ชื่อนักศึกษา</th>
              <th className="whitespace-nowrap pb-3 pt-3 text-center">คะแนนเฉลี่ย</th>
              <th className="whitespace-nowrap pb-3 pt-3 text-center">สัปดาห์ที่ทำ</th>
              {cloCodes.map((code) => (
                <th key={code} className="whitespace-nowrap pb-3 pt-3 text-center">
                  {code}
                </th>
              ))}
              <th className="whitespace-nowrap pb-3 pt-3 text-center">ฝึกซ้อม</th>
              <th className="whitespace-nowrap pb-3 pt-3 text-center pr-3">สรุปรายบุคคล</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {pageRows.map((r) => {
              const href = `/report/${courseId}/student/${r.latestWkNum}?student=${encodeURIComponent(r.studentId)}`;
              const practiceCount = r.isCurrentUser ? currentUserPracticeCount : null;
              return (
                <tr
                  key={r.studentId}
                  onClick={() => router.push(href)}
                  className={`cursor-pointer transition-colors hover:bg-paper-100 ${
                    r.isCurrentUser ? "bg-tu-gold-50" : ""
                  }`}
                >
                  <td className="whitespace-nowrap py-2.5 pl-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.studentName} />
                      <span className="font-medium text-ink-800">
                        {r.studentName}
                        {r.isCurrentUser && (
                          <span className="ml-2 rounded-full bg-tu-gold-100 px-2 py-0.5 text-[10px] font-bold text-tu-gold-700">
                            คุณ
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-center font-bold tabular-nums text-ink-900">
                    {r.avgPercent}%
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-center tabular-nums text-ink-600">{r.weeksDone}</td>
                  {cloCodes.map((code) => {
                    const c = r.cloPercents.find((x) => x.code === code);
                    return (
                      <td key={code} className="whitespace-nowrap py-2.5 text-center font-bold tabular-nums text-ink-900">
                        {c ? `${c.percent}%` : <span className="text-ink-300">-</span>}
                      </td>
                    );
                  })}
                  <td className="whitespace-nowrap py-3 text-center">
                    {practiceCount != null && practiceCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-paper-100 px-2.5 py-1 text-xs font-semibold text-ink-600 ring-1 ring-line">
                        <History className="h-3.5 w-3.5" />+
                        {practiceCount} ครั้ง
                      </span>
                    ) : (
                      <span className="text-ink-300">-</span>
                    )}
                  </td>
                  <td className="py-3 text-center pr-3" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={href}
                      title="ดูสรุปรายบุคคล"
                      aria-label="ดูสรุปรายบุคคล"
                      className="inline-flex text-tu-blue-600 transition-colors hover:text-tu-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5 + cloCodes.length} className="py-8 text-center text-sm text-ink-400">
                  ไม่พบนักศึกษาตามเงื่อนไขที่กรอง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3">
        <p className="text-[11px] text-ink-400">
          แสดง {filtered.length === 0 ? 0 : pageStart + 1}–
          {Math.min(pageStart + PAGE_SIZE, filtered.length)} จาก {filtered.length} คน
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-secondary !px-2.5 !py-1.5 disabled:opacity-40"
            aria-label="หน้าก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-1 text-xs font-semibold text-ink-600">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-secondary !px-2.5 !py-1.5 disabled:opacity-40"
            aria-label="หน้าถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-4 border-t border-line-soft pt-3 text-[11px] leading-relaxed text-ink-400">
        คอลัมน์ CLO และคะแนนเฉลี่ยคำนวณจากคำตอบจริงของแต่ละคนสะสมทุกสัปดาห์ · คอลัมน์ฝึกซ้อมแสดงจำนวนจริงได้เฉพาะแถวของคุณ
        เนื่องจากประวัติฝึกซ้อมของเพื่อนร่วมชั้น (ข้อมูลจำลอง) ไม่ได้เก็บไว้ในเครื่องนี้
      </p>
    </section>
  );
}

/** วงกลมย่อไอนิเชียลชื่อ สีเวียนตามชุดสีของระบบ (deterministic จากชื่อ) */
function Avatar({ name }: { name: string }) {
  const initials = name.trim().slice(0, 2) || "?";
  const hash = Array.from(name).reduce((h, c) => h + c.charCodeAt(0), 0);
  const hex = TAG_COLORS[hash % TAG_COLORS.length].hex;
  return (
    <span
      className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: hex }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
