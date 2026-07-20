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
  const { subject } = useCourse();
  const t = useTopics();

  const [addOpen, setAddOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);

  function handleAssign(week: string, colorKey: string) {
    t.assignSelectedToWeek(week, colorKey);
    setAddOpen(false);
  }

  function handleConfirm() {
    setSummaryOpen(false);
    router.push("/course");
  }

  return (
    <div>
      <PageHeader
        eyebrow="ขั้นตอนที่ 2"
        title="จัดหัวข้อรายสัปดาห์"
        subtitle={
          subject ? (
            <>
              วิชา <span className="font-semibold text-ink-700">{subject}</span>{" "}
              · คลิกการ์ดเพื่อเลือกหัวข้อ แล้วกด “จัดกลุ่ม” เพื่อจัดเข้าสัปดาห์
            </>
          ) : (
            "คลิกการ์ดเพื่อเลือกหัวข้อ แล้วกด “จัดกลุ่ม” เพื่อจัดเข้าสัปดาห์"
          )
        }
      />

      <div className="card overflow-hidden">
        {/* แถบเครื่องมือ: ตัวกรองสัปดาห์ + ปุ่มจัดกลุ่ม */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-paper-50 px-4 py-3 sm:px-5">
          <WeekBookmarks
            filter={t.filter}
            unassignedCount={t.unassignedCount}
            weekSummaries={t.weekSummaries}
            onFilter={t.setFilter}
          />

          {/* ปุ่มถูกปิดไว้จนกว่าจะเลือกหัวข้อ — ไม่ต้องเตือนด้วย alert อีก */}
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
