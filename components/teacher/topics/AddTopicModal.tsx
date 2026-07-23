"use client";

import { useState } from "react";
import type { SyllabusClo } from "@/lib/syllabus";
import Modal, { ModalHeader } from "@/components/ui/Modal";

/** เพิ่มหัวข้อใหม่ด้วยมือ — ตั้งชื่อ เลือกสัปดาห์ และ CLO ที่เกี่ยวข้องได้ตั้งแต่ตอนสร้าง */
export default function AddTopicModal({
  open,
  clos,
  weekOptions,
  onClose,
  onAdd,
}: {
  open: boolean;
  /** CLO ทั้งหมดของวิชานี้ — ให้เลือกว่าหัวข้อนี้เกี่ยวกับ CLO ไหนบ้าง */
  clos: SyllabusClo[];
  /** ตัวเลือกสัปดาห์ทั้งหมดของวิชานี้ */
  weekOptions: string[];
  onClose: () => void;
  onAdd: (title: string, weekAssigned: string | null, relatedClos: string[]) => void;
}) {
  const [value, setValue] = useState("");
  const [selectedClos, setSelectedClos] = useState<string[]>([]);
  const [week, setWeek] = useState<string | null>(null);

  function reset() {
    setValue("");
    setSelectedClos([]);
    setWeek(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function toggleClo(code: string) {
    setSelectedClos((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed, week, selectedClos);
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalHeader title="เพิ่มหัวข้อ" />

      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        placeholder="ชื่อหัวข้อ"
        className="field text-sm"
      />

      <div className="mt-4">
        <label className="label">สัปดาห์</label>
        <select
          value={week ?? ""}
          onChange={(e) => setWeek(e.target.value || null)}
          className="field text-sm"
        >
          <option value="">ยังไม่จัดเข้าสัปดาห์</option>
          {weekOptions.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      {clos.length > 0 && (
        <div className="mt-4">
          <label className="label">CLO ที่เกี่ยวข้อง</label>
          <div className="flex flex-wrap gap-1.5">
            {clos.map((clo) => {
              const active = selectedClos.includes(clo.code);
              return (
                <button
                  key={clo.code}
                  type="button"
                  onClick={() => toggleClo(clo.code)}
                  title={clo.description ?? undefined}
                  aria-pressed={active}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                    active
                      ? "bg-tu-red-500 text-white shadow-sm"
                      : "bg-paper-200 text-ink-600 ring-1 ring-line-strong hover:bg-paper-300"
                  }`}
                >
                  {clo.code}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2 border-t border-line-soft pt-4">
        <button onClick={handleClose} className="btn-ghost">
          ยกเลิก
        </button>
        <button
          onClick={handleAdd}
          disabled={!value.trim()}
          className="btn-primary px-5"
        >
          เพิ่ม
        </button>
      </div>
    </Modal>
  );
}
