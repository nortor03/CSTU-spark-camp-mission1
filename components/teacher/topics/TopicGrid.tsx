"use client";

import type { Topic, WeekConfigMap } from "@/lib/types";
import TopicCard from "./TopicCard";

/** ตารางแสดงการ์ดหัวข้อตาม filter ปัจจุบัน */
export default function TopicGrid({
  topics,
  filter,
  weekConfig,
  onToggleSelect,
  onEdit,
  onUnassign,
}: {
  topics: Topic[];
  filter: string;
  weekConfig: WeekConfigMap;
  onToggleSelect: (id: string) => void;
  onEdit: (topic: Topic) => void;
  onUnassign: (id: string) => void;
}) {
  if (topics.length === 0) {
    return (
      <div className="mb-8 grid min-h-[220px] place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center">
        <p className="text-xs text-slate-400">
          {filter === "all"
            ? "หัวข้อทั้งหมดถูกจัดเข้าสัปดาห์เรียบร้อยแล้ว"
            : "ไม่มีหัวข้อในหมวดหมู่นี้"}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8 grid min-h-[220px] content-start grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => (
        <TopicCard
          key={topic.id}
          topic={topic}
          showWeekBadge={filter !== "all"}
          weekColorKey={
            topic.weekAssigned
              ? weekConfig[topic.weekAssigned]?.colorKey
              : undefined
          }
          onToggleSelect={onToggleSelect}
          onEdit={onEdit}
          onUnassign={onUnassign}
        />
      ))}
    </div>
  );
}
