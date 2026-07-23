"use client";

import { useMemo, useState } from "react";
import { useCourse } from "./courseStore";
import { weekNumber } from "./weeks";
import type { Topic } from "./types";

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
  const { topics, setTopics, weekConfig, setWeekConfig, addTopics } = useCourse();
  // 'all' = ทุกหัวข้อ (ค่าเริ่มต้น) · 'unassigned' = เฉพาะที่ยังไม่จัดเข้าสัปดาห์ · อื่นๆ = ชื่อสัปดาห์
  const [filter, setFilter] = useState<string>("all");

  /** สลับการเลือกหัวข้อเพื่อจัดกลุ่ม */
  function toggleSelect(id: string) {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)),
    );
  }

  /**
   * แก้ไขชื่อหัวข้อ + CLO ที่เกี่ยวข้อง + สัปดาห์ (ผู้ใช้แก้ไขสิ่งที่ AI เสนอมา)
   * weekAssigned = null คือเอาออกจากสัปดาห์ (กลับไปกองที่ยังไม่จัด)
   */
  function renameTopic(
    id: string,
    title: string,
    relatedClos: string[],
    weekAssigned: string | null,
  ) {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, title, relatedClos, weekAssigned, aiGenerated: false }
          : t,
      ),
    );
  }

  /** เพิ่มหัวข้อใหม่ด้วยมือ (ไม่ได้มาจาก AI/syllabus) — เลือกสัปดาห์ + CLO ได้ตั้งแต่ตอนสร้าง */
  function addTopic(title: string, weekAssigned: string | null, relatedClos: string[]) {
    const topic: Topic = {
      id: crypto.randomUUID(),
      title,
      file: "เพิ่มเอง",
      selected: false,
      weekAssigned,
      aiGenerated: false,
      relatedClos,
    };
    addTopics([topic]);
  }

  /** สลับสัปดาห์ของหัวข้อ 2 อัน (ใช้ตอนลากสลับตำแหน่งในมุมมอง "ทั้งหมด") */
  function swapWeeks(idA: string, idB: string) {
    if (idA === idB) return;
    setTopics((prev) => {
      const a = prev.find((t) => t.id === idA);
      const b = prev.find((t) => t.id === idB);
      if (!a || !b) return prev;
      return prev.map((t) => {
        if (t.id === idA) return { ...t, weekAssigned: b.weekAssigned };
        if (t.id === idB) return { ...t, weekAssigned: a.weekAssigned };
        return t;
      });
    });
  }

  /** จัดหัวข้อที่เลือกไว้เข้าสัปดาห์ พร้อมกำหนดสีป้าย */
  function assignSelectedToWeek(week: string, colorKey: string) {
    setWeekConfig((prev) => ({ ...prev, [week]: { colorKey } }));
    setTopics((prev) =>
      prev.map((t) =>
        t.selected ? { ...t, weekAssigned: week, selected: false } : t,
      ),
    );
    // จัดเสร็จแล้วกลับไปดูหัวข้อที่เหลือที่ยังไม่จัด (ไม่เด้งไปสัปดาห์ที่เพิ่งจัด)
    setFilter("unassigned");
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

  /**
   * หัวข้อที่แสดงตาม filter ปัจจุบัน
   * มุมมอง "ทั้งหมด" เรียงตามเลขสัปดาห์เสมอ (ที่ยังไม่จัดไปอยู่ท้ายสุด) เพื่อให้ตำแหน่ง
   * แถวในหน้าจอตรงกับสัปดาห์จริง — ลากสลับตำแหน่งแล้วเห็นผลตรงกับที่ตาเห็นทันที
   */
  const visibleTopics = useMemo(() => {
    if (filter === "all") {
      return [...topics].sort((a, b) => {
        if (a.weekAssigned === null && b.weekAssigned === null) return 0;
        if (a.weekAssigned === null) return 1;
        if (b.weekAssigned === null) return -1;
        return Number(weekNumber(a.weekAssigned)) - Number(weekNumber(b.weekAssigned));
      });
    }
    if (filter === "unassigned")
      return topics.filter((t) => t.weekAssigned === null);
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
    addTopic,
    swapWeeks,
    assignSelectedToWeek,
    unassignTopic,
    selectedCount,
    unassignedCount,
    visibleTopics,
    weekSummaries,
  };
}
