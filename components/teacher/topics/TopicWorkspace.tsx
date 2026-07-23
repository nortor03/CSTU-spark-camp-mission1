"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Topic } from "@/lib/types";
import { useTopics } from "@/lib/useTopics";
import { useCourse } from "@/lib/courseStore";
import { tagStyles, weekNumber, weekOptions as buildWeekOptions } from "@/lib/weeks";
import PageHeader from "@/components/ui/PageHeader";
import TopicGrid from "./TopicGrid";
import AddToWeekModal from "./AddToWeekModal";
import EditTopicModal from "./EditTopicModal";
import AddTopicModal from "./AddTopicModal";
import AddCloModal from "./AddCloModal";
import SummaryPopup from "./SummaryPopup";

/** ตัวควบคุมหลักของหน้าสรุปหัวข้อ — รวม state, grid และ modal ทั้งหมด */
export default function TopicWorkspace() {
  const router = useRouter();
  const { subject, activeCourseId, clos, addClo, totalWeeks, addWeek, removeWeek } =
    useCourse();
  const t = useTopics();
  const weekOptionsList = buildWeekOptions(totalWeeks);

  // กลับไปหน้ารายละเอียดของวิชาที่กำลังทำอยู่ (ถ้าไม่มีให้กลับหน้ารายวิชา)
  const courseHref = activeCourseId ? `/course/${activeCourseId}` : "/course";

  const [addOpen, setAddOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [addCloOpen, setAddCloOpen] = useState(false);

  function handleAssign(week: string, colorKey: string) {
    t.assignSelectedToWeek(week, colorKey);
    setAddOpen(false);
  }

  function handleConfirm() {
    setSummaryOpen(false);
    router.push(courseHref);
  }

  return (
    <div>
      <PageHeader
        eyebrow="การจัดหัวข้อ"
        title="จัดหัวข้อรายสัปดาห์"
      />

      {/* อ้างอิง CLO ทั้งหมด — พับเก็บได้ ไม่ต้องคอย hover ป้าย CLO ทีละอันเพื่อดูความหมาย
          ปุ่ม "+ เพิ่ม CLO" อยู่นอก <details> เสมอ เห็นได้ทั้งตอนพับและกางออก */}
      <div className="mb-4 rounded-xl border border-line bg-white shadow-card">
        {clos.length > 0 && (
          <details className="group px-4 pt-3 sm:px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 pb-3 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-semibold text-ink-700">
                ผลลัพธ์การเรียนรู้ (CLO) ทั้งหมด
              </span>
              <span className="flex items-center gap-1.5 text-xs text-ink-400">
                {clos.length} ข้อ
                <ChevronIcon className="transition group-open:rotate-180" />
              </span>
            </summary>
            <ul className="space-y-2.5 border-t border-line-soft pb-3 pt-3">
              {clos.map((clo) => (
                <li key={clo.code} className="flex gap-3 text-xs">
                  <span className="h-fit flex-shrink-0 rounded-full bg-paper-200 px-2 py-0.5 text-[10px] font-bold text-ink-600 ring-1 ring-line-strong">
                    {clo.code}
                  </span>
                  <p className="leading-relaxed text-ink-600">
                    {clo.description ?? (
                      <span className="italic text-ink-400">
                        ไม่มีคำอธิบายในเอกสาร
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        )}
        <button
          type="button"
          onClick={() => setAddCloOpen(true)}
          className={`w-full px-4 py-2.5 text-center text-xs font-semibold text-ink-500 transition hover:bg-tu-red-50/40 hover:text-tu-red-600 sm:px-5 ${
            clos.length > 0 ? "border-t border-line-soft" : "rounded-xl"
          }`}
        >
          + เพิ่ม CLO
        </button>
      </div>

      {/* ทางลัดกรองหัวข้อ — ค่าเริ่มต้นคือ "ทั้งหมด" เห็นทุกหัวข้อพร้อมป้ายสัปดาห์กำกับ */}
      {t.topics.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 shadow-card">
          {/* กลุ่มมุมมอง: ทั้งหมด / ยังไม่จัด — จัดเป็น segmented control ชิ้นเดียว */}
          <div className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-lg bg-paper-200 p-1">
            <SegmentButton
              active={t.filter === "all"}
              onClick={() => t.setFilter("all")}
              label="ทั้งหมด"
              count={t.topics.length}
            />
            <SegmentButton
              active={t.filter === "unassigned"}
              onClick={() => t.setFilter("unassigned")}
              label="ยังไม่จัด"
              count={t.unassignedCount}
            />
          </div>

          <span
            className="hidden h-6 w-px flex-shrink-0 bg-line-strong sm:block"
            aria-hidden
          />

          {/* จำนวนสัปดาห์ทั้งหมดของวิชา — ปรับเพิ่ม/ลดได้ตรงนี้ (มีผลกับตัวเลือกสัปดาห์ในฟอร์มต่างๆ) */}
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
              สัปดาห์ ({totalWeeks})
            </span>
            <div className="flex items-center overflow-hidden rounded-md border border-line">
              <button
                type="button"
                onClick={removeWeek}
                title="ลดจำนวนสัปดาห์"
                className="grid h-6 w-6 place-items-center text-ink-500 transition hover:bg-paper-200 disabled:cursor-not-allowed disabled:opacity-30"
                disabled={totalWeeks <= 1}
              >
                −
              </button>
              <span className="h-6 w-px bg-line" aria-hidden />
              <button
                type="button"
                onClick={addWeek}
                title="เพิ่มจำนวนสัปดาห์"
                className="grid h-6 w-6 place-items-center text-ink-500 transition hover:bg-paper-200"
              >
                +
              </button>
            </div>
          </div>

          {t.weekSummaries.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {t.weekSummaries.map(({ week, count, colorKey }) => (
                <WeekChip
                  key={week}
                  active={t.filter === week}
                  onClick={() => t.setFilter(week)}
                  number={weekNumber(week)}
                  count={count}
                  colorKey={colorKey}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card overflow-visible z-10 relative">
        {/* แถบเครื่องมือ: ปุ่มจัดกลุ่ม */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft bg-paper-50 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAddOpen(true)}
              disabled={t.selectedCount === 0}
              className="btn-primary px-4 py-2 text-xs"
            >
              จัดกลุ่ม
              {t.selectedCount > 0 && (
                <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">
                  {t.selectedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setAddTopicOpen(true)}
              className="btn-secondary px-4 py-2 text-xs"
            >
              + เพิ่มหัวข้อ
            </button>
          </div>

          {t.filter === "all" && t.topics.length > 1 && (
            <p className="mt-1 text-[11px] text-ink-400">
              ลาก <span className="font-bold text-ink-500">⠿</span> เพื่อสลับสัปดาห์ระหว่างหัวข้อ
            </p>
          )}
        </div>

        {/* ตารางหัวข้อ */}
        <div className="p-4 sm:p-5">
          <TopicGrid
            topics={t.visibleTopics}
            filter={t.filter}
            weekConfig={t.weekConfig}
            clos={clos}
            onToggleSelect={t.toggleSelect}
            onEdit={setEditing}
            onUnassign={t.unassignTopic}
            onSwapWeeks={t.swapWeeks}
          />
        </div>

        {/* แถบล่าง: สรุป + ยืนยัน */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft bg-paper-50 px-4 py-3 sm:px-5">
          <p className="text-xs text-ink-500">
            เหลือ{" "}
            <span className="font-bold text-ink-700">{t.unassignedCount}</span>{" "}
            หัวข้อที่ยังไม่ได้จัดเข้าสัปดาห์
          </p>
          <button onClick={() => setSummaryOpen(true)} className="btn-ink px-6">
            ยืนยันข้อมูล
          </button>
        </div>
      </div>

      {/* Modals */}
      <AddToWeekModal
        open={addOpen}
        selectedCount={t.selectedCount}
        weekOptions={weekOptionsList}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAssign}
      />
      <EditTopicModal
        topic={editing}
        clos={clos}
        weekOptions={weekOptionsList}
        onClose={() => setEditing(null)}
        onSave={t.renameTopic}
      />
      <AddTopicModal
        open={addTopicOpen}
        clos={clos}
        weekOptions={weekOptionsList}
        onClose={() => setAddTopicOpen(false)}
        onAdd={t.addTopic}
      />
      <AddCloModal
        open={addCloOpen}
        onClose={() => setAddCloOpen(false)}
        onAdd={addClo}
      />
      <SummaryPopup
        open={summaryOpen}
        topics={t.topics}
        weekSummaries={t.weekSummaries}
        onClose={() => setSummaryOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-3.5 w-3.5 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

/**
 * ปุ่มในกลุ่ม segmented control ("ทั้งหมด" / "ยังไม่จัด")
 * active = พื้นขาว+เงาบาง (ดูเหมือน "ถูกกด") ไม่ active = โปร่งใส กลืนกับพื้นเทาอ่อนรอบๆ
 */
function SegmentButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-white text-ink-900 shadow-sm"
          : "text-ink-500 hover:text-ink-800"
      }`}
    >
      {label}
      <span
        className={`text-[10px] font-bold tabular-nums ${
          active ? "text-ink-400" : "text-ink-300"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/**
 * ป้ายกรองรายสัปดาห์ — เหรียญกลมเลขสัปดาห์ สีอ่อนของสัปดาห์นั้นตอนพัก
 * สีทึบ+ตัวขาวตอนเลือกอยู่ (ใช้ tagStyles ชุดเดียวกับที่สีป้ายสัปดาห์ใช้ทั้งแอป)
 */
function WeekChip({
  active,
  onClick,
  number,
  count,
  colorKey,
}: {
  active: boolean;
  onClick: () => void;
  number: string;
  count: number;
  colorKey: string;
}) {
  const styles = tagStyles(colorKey);
  return (
    <button
      type="button"
      onClick={onClick}
      title={`สัปดาห์ที่ ${number} · ${count} หัวข้อ`}
      className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-xs font-bold transition ${
        active ? "shadow-sm" : "hover:brightness-95"
      }`}
      style={active ? styles.solid : styles.soft}
    >
      {number}
    </button>
  );
}
