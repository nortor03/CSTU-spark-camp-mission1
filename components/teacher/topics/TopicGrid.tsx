"use client";

import { useState } from "react";
import type { Topic, WeekConfigMap } from "@/lib/types";
import type { SyllabusClo } from "@/lib/syllabus";
import TopicCard from "./TopicCard";

/** ตารางแสดงการ์ดหัวข้อตาม filter ปัจจุบัน */
export default function TopicGrid({
  topics,
  filter,
  weekConfig,
  clos,
  onToggleSelect,
  onEdit,
  onUnassign,
  onSwapWeeks,
}: {
  topics: Topic[];
  filter: string;
  weekConfig: WeekConfigMap;
  /** CLO ของวิชานี้ — ใช้หาคำอธิบายเต็มมาโชว์เป็น tooltip บนป้าย CLO ของแต่ละหัวข้อ */
  clos: SyllabusClo[];
  onToggleSelect: (id: string) => void;
  onEdit: (topic: Topic) => void;
  onUnassign: (id: string) => void;
  /** ลากการ์ดหัวข้อ 2 อันมาสลับกัน — สลับสัปดาห์ของทั้งคู่ */
  onSwapWeeks: (idA: string, idB: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // ลากสลับสัปดาห์มีความหมายเฉพาะตอนดูมุมมอง "ทั้งหมด" (เห็นทุกสัปดาห์เรียงกันอยู่)
  const reorderable = filter === "all";

  if (topics.length === 0) {
    const message =
      filter === "all"
        ? "ยังไม่มีหัวข้อ"
        : filter === "unassigned"
          ? "หัวข้อทั้งหมดถูกจัดเข้าสัปดาห์เรียบร้อยแล้ว"
          : "ไม่มีหัวข้อในหมวดหมู่นี้";
    return (
      <div className="grid min-h-[220px] place-items-center rounded-lg border border-dashed border-line-strong bg-paper-50 px-4 text-center">
        <p className="text-sm text-ink-500">{message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[220px] divide-y divide-line-soft overflow-hidden rounded-lg border border-line">
      {topics.map((topic) => (
        <TopicCard
          key={topic.id}
          topic={topic}
          showWeekBadge={filter !== "unassigned"}
          weekColorKey={
            topic.weekAssigned
              ? weekConfig[topic.weekAssigned]?.colorKey
              : undefined
          }
          clos={clos}
          onToggleSelect={onToggleSelect}
          onEdit={onEdit}
          onUnassign={onUnassign}
          draggable={reorderable}
          isDragging={draggedId === topic.id}
          isDropTarget={reorderable && dragOverId === topic.id && draggedId !== topic.id}
          onDragStart={() => setDraggedId(topic.id)}
          onDragEnd={() => {
            setDraggedId(null);
            setDragOverId(null);
          }}
          onDragOverCard={() => {
            if (draggedId && draggedId !== topic.id) setDragOverId(topic.id);
          }}
          onDropOn={() => {
            if (draggedId && draggedId !== topic.id) {
              onSwapWeeks(draggedId, topic.id);
            }
            setDraggedId(null);
            setDragOverId(null);
          }}
        />
      ))}
    </div>
  );
}
