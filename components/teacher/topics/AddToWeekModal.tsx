"use client";

import { useState } from "react";
import Modal, { ModalHeader } from "@/components/ui/Modal";
import { TAG_COLORS, WEEK_OPTIONS, isCustomColor } from "@/lib/weeks";

/**
 * จัดหัวข้อที่เลือกไว้เข้าสัปดาห์ + เลือกสีป้ายกำกับ
 */
export default function AddToWeekModal({
  open,
  selectedCount,
  onClose,
  onSubmit,
}: {
  open: boolean;
  selectedCount: number;
  onClose: () => void;
  onSubmit: (week: string, colorKey: string) => void;
}) {
  const [week, setWeek] = useState(WEEK_OPTIONS[0]);
  const [colorKey, setColorKey] = useState(TAG_COLORS[0].key);

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-sm">
      <ModalHeader title="จัดหัวข้อเข้าสัปดาห์" />

      <div className="mb-6 space-y-4">
        <div>
          <label className="label">เลือกสัปดาห์เรียน</label>
          <select
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            className="field text-sm"
          >
            {WEEK_OPTIONS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">เลือกสีประจำสัปดาห์</label>
          <div className="flex items-center gap-2.5 rounded-lg border border-line bg-paper-50 px-3 py-2.5">
            {/* สีแนะนำ */}
            {TAG_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColorKey(c.key)}
                title={c.label}
                style={{ backgroundColor: c.hex }}
                className={`flex h-7 w-7 items-center justify-center rounded-full ring-offset-2 ring-offset-paper-50 transition ${
                  colorKey === c.key
                    ? "ring-2 ring-ink-800"
                    : "hover:scale-110"
                }`}
              >
                {colorKey === c.key && <CheckIcon />}
              </button>
            ))}

            {/* เส้นคั่นก่อนช่องเลือกสีเอง */}
            <span className="mx-0.5 h-5 w-px bg-line-strong" />

            {/* เลือกสีเอง — คลิกเพื่อเปิด color picker ของเบราว์เซอร์ */}
            <label
              title="เลือกสีเอง"
              style={
                isCustomColor(colorKey)
                  ? { backgroundColor: colorKey }
                  : {
                      background:
                        "conic-gradient(from 0deg, #C8102E, #F2A900, #10B981, #0EA5E9, #8B5CF6, #C8102E)",
                    }
              }
              className={`relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-paper-50 transition ${
                isCustomColor(colorKey)
                  ? "ring-2 ring-ink-800"
                  : "hover:scale-110"
              }`}
            >
              <input
                type="color"
                value={isCustomColor(colorKey) ? colorKey : "#C8102E"}
                onChange={(e) => setColorKey(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              {isCustomColor(colorKey) ? (
                <CheckIcon />
              ) : (
                <svg
                  className="h-3 w-3 text-white drop-shadow"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 5v14M5 12h14"
                  />
                </svg>
              )}
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
        <button onClick={onClose} className="btn-ghost">
          ยกเลิก
        </button>
        <button
          onClick={() => onSubmit(week, colorKey)}
          className="btn-primary px-5"
        >
          ตกลง
        </button>
      </div>
    </Modal>
  );
}

/** เครื่องหมายถูกสีขาว แสดงในสวอตช์สีที่กำลังเลือกอยู่ */
function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-white drop-shadow"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
