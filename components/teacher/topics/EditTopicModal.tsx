"use client";

import { useEffect, useState } from "react";
import type { Topic } from "@/lib/types";
import Modal, { ModalHeader } from "@/components/ui/Modal";

/**
 * แก้ไขชื่อหัวข้อที่ AI เสนอมา
 * เปิดเมื่อผู้ใช้กดปุ่มดินสอบนการ์ด
 */
export default function EditTopicModal({
  topic,
  onClose,
  onSave,
}: {
  topic: Topic | null;
  onClose: () => void;
  onSave: (id: string, title: string) => void;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (topic) setValue(topic.title);
  }, [topic]);

  function handleSave() {
    if (!topic) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSave(topic.id, trimmed);
    onClose();
  }

  return (
    <Modal open={!!topic} onClose={onClose}>
      <ModalHeader
        title="แก้ไขชื่อหัวข้อ"
        subtitle="ปรับชื่อที่ AI แนะนำให้ตรงกับเนื้อหาที่คุณต้องการ"
      />

      {topic && (
        <p className="mb-3 flex items-center gap-1.5 rounded-md bg-paper-100 px-2.5 py-1.5 text-[11px] text-ink-500">
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <span className="font-mono">{topic.file}</span>
        </p>
      )}

      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        placeholder="ชื่อหัวข้อ"
        className="field text-sm"
      />

      <div className="mt-6 flex justify-end gap-2 border-t border-line-soft pt-4">
        <button onClick={onClose} className="btn-ghost">
          ยกเลิก
        </button>
        <button
          onClick={handleSave}
          disabled={!value.trim()}
          className="btn-primary px-5"
        >
          บันทึก
        </button>
      </div>
    </Modal>
  );
}
