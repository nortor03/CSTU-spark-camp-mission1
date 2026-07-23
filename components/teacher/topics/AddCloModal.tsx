"use client";

import { useState } from "react";
import Modal, { ModalHeader } from "@/components/ui/Modal";

/** เพิ่ม CLO ใหม่ด้วยมือ — เผื่อ syllabus แกะไม่ครบ หรือวิชาไม่มี syllabus เลย */
export default function AddCloModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (code: string, description: string | null) => void;
}) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  function reset() {
    setCode("");
    setDescription("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleAdd() {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;
    onAdd(trimmedCode, description.trim() || null);
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalHeader title="เพิ่ม CLO" />

      <div>
        <label className="label">รหัส CLO</label>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="เช่น CLO8"
          className="field text-sm"
        />
      </div>

      <div className="mt-4">
        <label className="label">
          คำอธิบาย{" "}
          <span className="font-normal text-ink-400">(ไม่บังคับ)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="ผลลัพธ์การเรียนรู้ของ CLO นี้"
          className="field resize-none text-sm"
        />
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t border-line-soft pt-4">
        <button onClick={handleClose} className="btn-ghost">
          ยกเลิก
        </button>
        <button
          onClick={handleAdd}
          disabled={!code.trim()}
          className="btn-primary px-5"
        >
          เพิ่ม
        </button>
      </div>
    </Modal>
  );
}
