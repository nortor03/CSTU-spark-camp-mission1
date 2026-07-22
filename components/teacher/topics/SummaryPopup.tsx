"use client";

import type { Topic } from "@/lib/types";
import type { WeekSummary } from "@/lib/useTopics";
import Modal, { ModalHeader } from "@/components/ui/Modal";
import { resolveHex } from "@/lib/weeks";

/** ป็อปอัปสรุปการจัดกลุ่มหัวข้อทั้งหมดก่อนยืนยันส่ง */
export default function SummaryPopup({
  open,
  topics,
  weekSummaries,
  onClose,
  onConfirm,
}: {
  open: boolean;
  topics: Topic[];
  weekSummaries: WeekSummary[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  const unassigned = topics.filter((t) => t.weekAssigned === null);

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-md">
      <ModalHeader
        title="ตรวจสอบสรุปการจัดหัวข้อ"
      />

      <div className="mb-6 max-h-72 space-y-3 overflow-y-auto pr-1">
        {weekSummaries.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">
            ยังไม่มีหัวข้อใดถูกจัดเข้าสัปดาห์
          </p>
        ) : (
          <div className="divide-y divide-line-soft overflow-hidden rounded-lg border border-line">
            {weekSummaries.map(({ week, colorKey }) => {
              const items = topics.filter((t) => t.weekAssigned === week);
              return (
                <div key={week} className="p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-ink-800">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: resolveHex(colorKey) }}
                      />
                      {week}
                    </span>
                    <span className="text-[10px] font-medium text-ink-400">
                      รวม {items.length} หัวข้อ
                    </span>
                  </div>
                  <ul className="space-y-1 pl-[18px]">
                    {items.map((t) => (
                      <li key={t.id} className="text-xs leading-relaxed text-ink-600">
                        {t.title}{" "}
                        <span className="text-[10px] text-ink-400">
                          ({t.file})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {unassigned.length > 0 && (
          <div className="rounded-lg border border-dashed border-line-strong bg-paper-50 p-3.5">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              หัวข้อที่ยังไม่ได้จัดลงสัปดาห์
            </p>
            <ul className="space-y-0.5">
              {unassigned.map((t) => (
                <li
                  key={t.id}
                  className="list-inside list-disc text-xs text-ink-500"
                >
                  {t.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-line-soft pt-4">
        <button onClick={onClose} className="btn-ghost">
          แก้ไขเพิ่มเติม
        </button>
        <button onClick={onConfirm} className="btn-primary px-5">
          ยืนยันและส่งข้อมูล
        </button>
      </div>
    </Modal>
  );
}
