"use client";

import { useEffect, useState } from "react";
import Modal, { ModalHeader } from "@/components/ui/Modal";

export interface EditingClo {
  index: number;
  code: string;
  description: string | null;
}

/** แก้ไข CLO 1 ข้อ — เปลี่ยนรหัส/คำอธิบาย (ปุ่มลบอยู่ที่แถว CLO ในหน้ารายวิชา) */
export default function EditCloModal({
  editing,
  onClose,
  onSave,
}: {
  editing: EditingClo | null;
  onClose: () => void;
  onSave: (index: number, code: string, description: string | null) => void;
}) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  // เติมค่าเดิมทุกครั้งที่เปิดแก้ CLO ข้อใหม่
  useEffect(() => {
    if (editing) {
      setCode(editing.code);
      setDescription(editing.description ?? "");
    }
  }, [editing]);

  function handleSave() {
    if (!editing) return;
    const trimmedCode = code.trim();
    if (!trimmedCode) return;
    onSave(editing.index, trimmedCode, description.trim() || null);
    onClose();
  }

  return (
    <Modal open={editing !== null} onClose={onClose}>
      <ModalHeader title="แก้ไข CLO" />

      <div>
        <label className="label">รหัส CLO</label>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="เช่น CLO 1"
          className="field text-sm"
        />
      </div>

      <div className="mt-4">
        <label className="label">
          คำอธิบาย <span className="font-normal text-ink-400">(ไม่บังคับ)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="อธิบายว่าผู้เรียนควรทำอะไรได้เมื่อจบวิชา"
          className="field text-sm"
        />
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t border-line-soft pt-4">
        <button type="button" onClick={onClose} className="btn-ghost">
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!code.trim()}
          className="btn-primary px-5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          บันทึก
        </button>
      </div>
    </Modal>
  );
}
