"use client";

import { useEffect, useState } from "react";
import Modal, { ModalHeader } from "@/components/ui/Modal";
import { Trash2, Undo2, Check, Plus } from "lucide-react";
import type { Topic } from "@/lib/types";
import { TAG_COLORS, isCustomColor } from "@/lib/weeks";

interface Row {
  id: string;
  title: string;
  remove: boolean;
}

export interface WeekTopicEdit {
  id: string;
  title: string;
  remove: boolean;
}

/**
 * แก้หัวข้อของ 1 สัปดาห์ — เปลี่ยนชื่อหัวข้อ หรือเอาหัวข้อออกจากสัปดาห์นั้น
 * (หัวข้อที่เอาออกจะกลับไปเป็น "ยังไม่จัดเข้าสัปดาห์" ในหน้าจัดหัวข้อ ไม่ได้ลบทิ้ง)
 */
export default function EditWeekTopicsModal({
  week,
  topics,
  colorKey,
  onClose,
  onApply,
}: {
  week: string | null;
  topics: Topic[];
  colorKey?: string;
  onClose: () => void;
  onApply: (edits: WeekTopicEdit[], colorKey: string) => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [color, setColor] = useState<string>(TAG_COLORS[0].key);

  // เติมค่าเริ่มต้นทุกครั้งที่เปิดแก้สัปดาห์ใหม่
  useEffect(() => {
    if (week) {
      setRows(topics.map((t) => ({ id: t.id, title: t.title, remove: false })));
      setColor(colorKey ?? TAG_COLORS[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week]);

  function setTitle(id: string, title: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, title } : r)));
  }
  function toggleRemove(id: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, remove: !r.remove } : r)),
    );
  }

  function handleSave() {
    onApply(
      rows.map(({ id, title, remove }) => ({ id, title: title.trim(), remove })),
      color,
    );
    onClose();
  }

  const removingCount = rows.filter((r) => r.remove).length;

  return (
    <Modal open={week !== null} onClose={onClose}>
      <ModalHeader title={`แก้ไขหัวข้อ · ${week ?? ""}`} />

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-400">
          สัปดาห์นี้ยังไม่มีหัวข้อ
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              <input
                value={r.title}
                onChange={(e) => setTitle(r.id, e.target.value)}
                disabled={r.remove}
                className={`field flex-1 text-sm ${
                  r.remove ? "text-ink-300 line-through" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => toggleRemove(r.id)}
                title={r.remove ? "เลิกเอาออก" : "เอาออกจากสัปดาห์"}
                className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg border transition ${
                  r.remove
                    ? "border-line bg-paper-50 text-ink-500 hover:text-ink-700"
                    : "border-line bg-white text-ink-400 hover:border-tu-red-200 hover:bg-tu-red-50/50 hover:text-tu-red-600"
                }`}
              >
                {r.remove ? (
                  <Undo2 className="h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
        หัวข้อที่ถูกลบจะย้ายกลับไปที่ “ยังไม่จัดเข้าสัปดาห์” ในหน้าจัดหัวข้อ
      </p>

      {/* สีประจำสัปดาห์ — ใช้ไล่ทั้งเลขสัปดาห์/ป้าย/ปุ่มในระบบ */}
      <div className="mt-5">
        <label className="label">สีประจำสัปดาห์</label>
        <div className="flex items-center gap-2.5 rounded-lg border border-line bg-paper-50 px-3 py-2.5">
          {/* สีแนะนำ */}
          {TAG_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setColor(c.key)}
              title={c.label}
              style={{ backgroundColor: c.hex }}
              className={`flex h-7 w-7 items-center justify-center rounded-full ring-offset-2 ring-offset-paper-50 transition ${
                color === c.key ? "ring-2 ring-ink-800" : "hover:scale-110"
              }`}
            >
              {color === c.key && (
                <Check
                  className="h-3.5 w-3.5 text-white drop-shadow"
                  strokeWidth={3}
                />
              )}
            </button>
          ))}

          {/* เส้นคั่นก่อนช่องเลือกสีเอง */}
          <span className="mx-0.5 h-5 w-px bg-line-strong" />

          {/* เลือกสีเอง — คลิกเพื่อเปิด color picker ของเบราว์เซอร์ */}
          <label
            title="เลือกสีเอง"
            style={
              isCustomColor(color)
                ? { backgroundColor: color }
                : {
                    background:
                      "conic-gradient(from 0deg, #C8102E, #F2A900, #10B981, #0EA5E9, #8B5CF6, #C8102E)",
                  }
            }
            className={`relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-paper-50 transition ${
              isCustomColor(color) ? "ring-2 ring-ink-800" : "hover:scale-110"
            }`}
          >
            <input
              type="color"
              value={isCustomColor(color) ? color : "#C8102E"}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            {isCustomColor(color) ? (
              <Check
                className="h-3.5 w-3.5 text-white drop-shadow"
                strokeWidth={3}
              />
            ) : (
              <Plus
                className="h-3 w-3 text-white drop-shadow"
                strokeWidth={2.5}
              />
            )}
          </label>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-2 border-t border-line-soft pt-4">
        <span className="text-xs text-ink-400">
          {removingCount > 0 ? `จะเอาออก ${removingCount} หัวข้อ` : " "}
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary px-5"
          >
            บันทึก
          </button>
        </div>
      </div>
    </Modal>
  );
}
