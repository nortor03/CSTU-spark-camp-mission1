"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Topic } from "@/lib/types";
import { useTopics } from "@/lib/useTopics";
import { useCourse } from "@/lib/courseStore";
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

  function handleAddClick() {
    if (t.selectedCount === 0) {
      alert("กรุณาเลือกหัวข้อที่ต้องการจัดกลุ่มก่อน");
      return;
    }
    setAddOpen(true);
  }

  function handleAssign(week: string, colorKey: string) {
    t.assignSelectedToWeek(week, colorKey);
    setAddOpen(false);
  }

  function handleConfirm() {
    setSummaryOpen(false);
    router.push("/course");
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8">
      {/* หัวเรื่อง + ปุ่มจัดกลุ่ม */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">สรุปหัวข้อ</h1>
          <p className="mt-0.5 text-xs text-slate-400">
            {subject ? (
              <>
                วิชา <span className="font-semibold text-slate-500">{subject}</span>{" "}
                · คลิกการ์ดเพื่อเลือก แล้วกด “จัดกลุ่ม”
              </>
            ) : (
              "คลิกการ์ดเพื่อเลือก แล้วกด “จัดกลุ่ม” เพื่อจัดเข้าสัปดาห์"
            )}
          </p>
        </div>

        <button
          onClick={handleAddClick}
          className="flex items-center gap-1 rounded-xl bg-tu-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-tu-red-600"
        >
          + จัดกลุ่ม
          {t.selectedCount > 0 && (
            <span className="ml-1 rounded-full bg-white/25 px-1.5 text-xs font-bold">
              {t.selectedCount}
            </span>
          )}
        </button>
      </div>

      {/* แถบตัวกรองรายสัปดาห์ */}
      <div className="mb-6 flex justify-end border-b border-slate-200 pb-3">
        <WeekBookmarks
          filter={t.filter}
          unassignedCount={t.unassignedCount}
          weekSummaries={t.weekSummaries}
          onFilter={t.setFilter}
        />
      </div>

      {/* ตารางหัวข้อ */}
      <TopicGrid
        topics={t.visibleTopics}
        filter={t.filter}
        weekConfig={t.weekConfig}
        onToggleSelect={t.toggleSelect}
        onEdit={setEditing}
        onUnassign={t.unassignTopic}
      />

      {/* ปุ่มยืนยันสรุป */}
      <div className="flex justify-end border-t border-slate-100 pt-5">
        <button
          onClick={() => setSummaryOpen(true)}
          className="rounded-xl bg-slate-900 px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          ยืนยันข้อมูล
        </button>
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
