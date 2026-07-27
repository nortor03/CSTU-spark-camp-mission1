"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WEAK_BELOW, type Submission } from "@/lib/analytics";
import { weekNumber, TAG_COLORS } from "@/lib/weeks";
import {
  ChevronRight,
  ChevronLeft,
  Download,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

const PAGE_SIZE = 8;

/**
 * ตารางผลแบบทดสอบรายคน — กรองตามสถานะ, ส่งออก CSV, และแบ่งหน้า
 */
export default function SubmissionsTable({
  submissions,
  weekLabel,
  week,
  courseId,
  courseSubject,
  isQuizAssigned,
}: {
  submissions: Submission[];
  weekLabel: string;
  week: string;
  courseId: string;
  courseSubject: string;
  isQuizAssigned?: boolean;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | "pass" | "fail">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const sorted = useMemo(
    () => [...submissions].sort((a, b) => a.percent - b.percent),
    [submissions],
  );
  const filtered = useMemo(() => {
    if (statusFilter === "pass") return sorted.filter((s) => s.percent >= WEAK_BELOW);
    if (statusFilter === "fail") return sorted.filter((s) => s.percent < WEAK_BELOW);
    return sorted;
  }, [sorted, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, week]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function exportCsv() {
    const header = ["รหัส", "ชื่อ", "คะแนน", "เต็ม", "เปอร์เซ็นต์", "สถานะ"];
    const lines = filtered.map((s) =>
      [
        s.studentId,
        s.studentName,
        s.score,
        s.total,
        `${s.percent}%`,
        s.percent >= WEAK_BELOW ? "ผ่าน" : "ไม่ผ่าน",
      ].join(","),
    );
    const csv = "\uFEFF" + [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ผลแบบทดสอบ-${courseSubject.replace(/\s+/g, "-")}-${week}.csv`;
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
            {isQuizAssigned !== false ? `ผลแบบทดสอบ: ${weekLabel}` : "ภาพรวมกิจกรรมรายสัปดาห์"}
          </h2>
        </div>

        {isQuizAssigned !== false && (
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
                    { key: "pass", label: "ผ่านเกณฑ์" },
                    { key: "fail", label: "ไม่ผ่านเกณฑ์" },
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
        )}
      </div>

      <hr className="rule-gold my-4" />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b-2 border-line text-left text-[11px] font-bold uppercase tracking-wider text-ink-500 bg-paper-50">
              <th className="pb-3 pt-3 pl-3">ชื่อนักศึกษา</th>
              {isQuizAssigned !== false ? (
                <>
                  <th className="pb-3 pt-3 text-right">คะแนน</th>
                  <th className="pb-3 pt-3 text-center">สถานะ</th>
                  <th className="pb-3 pt-3 text-right pr-3">สรุปรายบุคคล</th>
                </>
              ) : (
                <>
                  <th className="pb-3 pt-3 text-center">สถานะ</th>
                  <th className="pb-3 pt-3 text-right pr-3">บันทึกสรุป</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {pageRows.map((s) => {
              const pass = s.percent >= WEAK_BELOW;
              // Mock summary submission status for No Quiz mode
              const isSubmitted = s.percent > 20; 
              
              return (
                <tr
                  key={s.id}
                  onClick={() =>
                    router.push(`/report/${courseId}/${weekNumber(week)}/${encodeURIComponent(s.studentId)}`)
                  }
                  className={`cursor-pointer transition-colors hover:bg-paper-100 ${
                    s.isCurrentUser ? "bg-tu-gold-50" : ""
                  }`}
                >
                  <td className="py-2.5 pl-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.studentName} />
                      <span className="font-medium text-ink-800">
                        {s.studentName}
                        {s.isCurrentUser && (
                          <span className="ml-2 rounded-full bg-tu-gold-100 px-2 py-0.5 text-[10px] font-bold text-tu-gold-700">
                            คุณ
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  {isQuizAssigned !== false ? (
                    <>
                      <td className="py-2.5 text-right tabular-nums text-ink-600">
                        {s.score}/{s.total}
                        <span className="ml-1.5 font-bold text-ink-900">({s.percent}%)</span>
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                            pass ? "bg-emerald-100 text-emerald-800" : "bg-tu-red-100 text-tu-red-800"
                          }`}
                        >
                          {pass ? "Pass" : "Fail"}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-3">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-tu-blue-600 group-hover:text-tu-blue-700">
                          ดูข้อสังเกต
                          <ExternalLink className="h-4 w-4" />
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                            isSubmitted
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-paper-200 text-ink-500"
                          }`}
                        >
                          {isSubmitted ? "ส่งแล้ว" : "ยังไม่ส่ง"}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                            isSubmitted
                              ? "text-tu-blue-600 group-hover:text-tu-blue-700"
                              : "text-ink-300 cursor-not-allowed"
                          }`}
                        >
                          ดูบันทึก
                          <ExternalLink className="h-4 w-4" />
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-ink-400">
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
        ต้นแบบนี้ใช้ข้อมูลเพื่อนร่วมชั้นจำลองประกอบ เพื่อให้เห็นภาพรวมของห้อง ในระบบจริงควรแสดงผลรวมแบบไม่ระบุตัวตนเป็นค่าเริ่มต้น
        และเปิดดูรายบุคคลเฉพาะเมื่อจำเป็น
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
