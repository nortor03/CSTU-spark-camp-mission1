"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Topic } from "@/lib/types";
import { useTopics } from "@/lib/useTopics";
import { useCourse } from "@/lib/courseStore";
import PageHeader from "@/components/ui/PageHeader";
import TopicGrid from "./TopicGrid";
import WeekBookmarks from "./WeekBookmarks";
import AddToWeekModal from "./AddToWeekModal";
import EditTopicModal from "./EditTopicModal";
import SummaryPopup from "./SummaryPopup";

/** ตัวควบคุมหลักของหน้าสรุปหัวข้อ — รวม state, grid และ modal ทั้งหมด */
export default function TopicWorkspace() {
  const router = useRouter();
  const { subject, activeCourseId } = useCourse();
  const t = useTopics();

  // กลับไปหน้ารายละเอียดของวิชาที่กำลังทำอยู่ (ถ้าไม่มีให้กลับหน้ารายวิชา)
  const courseHref = activeCourseId ? `/course/${activeCourseId}` : "/course";

  const [addOpen, setAddOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);

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

      <div className="card overflow-visible z-10 relative">
        {/* แถบเครื่องมือ: ปุ่มจัดกลุ่ม + ตัวกรองสัปดาห์ (อยู่ขวา) */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft bg-paper-50 px-4 py-3 sm:px-5">
          <button
            onClick={() => setAddOpen(true)}
            disabled={t.selectedCount === 0}
            className="btn-primary px-4 py-2 text-xs mt-1"
          >
            จัดกลุ่ม
            {t.selectedCount > 0 && (
              <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">
                {t.selectedCount}
              </span>
            )}
          </button>

          <WeekBookmarks
            filter={t.filter}
            unassignedCount={t.unassignedCount}
            weekSummaries={t.weekSummaries}
            onFilter={t.setFilter}
          />
        </div>

        {/* ตารางหัวข้อ */}
        <div className="p-4 sm:p-5">
          <TopicGrid
            topics={t.visibleTopics}
            filter={t.filter}
            weekConfig={t.weekConfig}
            onToggleSelect={t.toggleSelect}
            onEdit={setEditing}
            onUnassign={t.unassignTopic}
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
        onClose={() => setAddOpen(false)}
        onSubmit={handleAssign}
      />
      <EditTopicModal
        topic={editing}
        onClose={() => setEditing(null)}
        onSave={t.renameTopic}
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
