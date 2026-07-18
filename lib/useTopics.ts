"use client";

import { useMemo, useState } from "react";
import { useCourse } from "./courseStore";
import { weekNumber } from "./weeks";

/** สรุปข้อมูลของสัปดาห์ที่มีหัวข้ออยู่ */
export interface WeekSummary {
  week: string;
  count: number;
  colorKey: string;
}

/**
 * hook รวมสถานะและ logic ของหน้าสรุปหัวข้อ
 * หัวข้อ/สีสัปดาห์ดึงจาก store กลาง (useCourse) เพื่อแชร์ข้ามหน้าได้
 * ส่วน filter เป็น state ของ UI เฉพาะหน้านี้
 */
export function useTopics() {
  const { topics, setTopics, weekConfig, setWeekConfig } = useCourse();
  const [filter, setFilter] = useState<string>("all"); // 'all' = ยังไม่จัดกลุ่ม

  /** สลับการเลือกหัวข้อเพื่อจัดกลุ่ม */
  function toggleSelect(id: string) {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)),
    );
  }

  /** แก้ไขชื่อหัวข้อ (ผู้ใช้แก้ชื่อที่ AI เสนอมา) */
  function renameTopic(id: string, title: string) {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, title, aiGenerated: false } : t,
      ),
    );
  }

  /** จัดหัวข้อที่เลือกไว้เข้าสัปดาห์ พร้อมกำหนดสีป้าย */
  function assignSelectedToWeek(week: string, colorKey: string) {
    setWeekConfig((prev) => ({ ...prev, [week]: { colorKey } }));
    setTopics((prev) =>
      prev.map((t) =>
        t.selected ? { ...t, weekAssigned: week, selected: false } : t,
      ),
    );
    // จัดเสร็จแล้วกลับไปดูหัวข้อที่ยังไม่จัด (ไม่เด้งไปสัปดาห์ที่เพิ่งจัด)
    setFilter("all");
  }

  /** ปลดหัวข้อออกจากสัปดาห์ กลับไปยังกองที่ยังไม่จัด */
  function unassignTopic(id: string) {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, weekAssigned: null, selected: false } : t,
      ),
    );
  }

  const selectedCount = topics.filter((t) => t.selected).length;
  const unassignedCount = topics.filter((t) => t.weekAssigned === null).length;

  /** หัวข้อที่แสดงตาม filter ปัจจุบัน */
  const visibleTopics = useMemo(() => {
    if (filter === "all") return topics.filter((t) => t.weekAssigned === null);
    return topics.filter((t) => t.weekAssigned === filter);
  }, [topics, filter]);

  /** รายการสัปดาห์ที่มีหัวข้ออยู่ (สำหรับ dropdown / สรุป) */
  const weekSummaries = useMemo<WeekSummary[]>(() => {
    const weeks = Array.from(
      new Set(
        topics
          .filter((t) => t.weekAssigned !== null)
          .map((t) => t.weekAssigned as string),
      ),
    ).sort((a, b) => Number(weekNumber(a)) - Number(weekNumber(b)));
    return weeks.map((week) => ({
      week,
      count: topics.filter((t) => t.weekAssigned === week).length,
      colorKey: weekConfig[week]?.colorKey ?? "red",
    }));
  }, [topics, weekConfig]);

  return {
    topics,
    filter,
    setFilter,
    weekConfig,
    toggleSelect,
    renameTopic,
    assignSelectedToWeek,
    unassignTopic,
    selectedCount,
    unassignedCount,
    visibleTopics,
    weekSummaries,
  };
}
