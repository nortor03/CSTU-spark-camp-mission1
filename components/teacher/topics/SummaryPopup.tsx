"use client";

import type { Topic } from "@/lib/types";
import type { WeekSummary } from "@/lib/useTopics";
import Modal from "@/components/ui/Modal";
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
      <h2 className="mb-1 text-lg font-bold text-slate-800">
        ตรวจสอบสรุปการจัดหัวข้อรายสัปดาห์
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        ตรวจความถูกต้องของการจัดหัวข้อก่อนยืนยันบันทึกเข้าระบบ
      </p>

      <div className="mb-6 max-h-72 space-y-3 overflow-y-auto pr-1">
        {weekSummaries.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            ยังไม่มีหัวข้อใดถูกจัดเข้าสัปดาห์
          </p>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
            {weekSummaries.map(({ week, colorKey }) => {
              const items = topics.filter((t) => t.weekAssigned === week);
              return (
                <div key={week} className="p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: resolveHex(colorKey) }}
                      />
                      {week}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      รวม {items.length} หัวข้อ
                    </span>
                  </div>
                  <ul className="space-y-1 pl-[22px]">
                    {items.map((t) => (
                      <li key={t.id} className="text-xs text-slate-600">
                        {t.title}{" "}
                        <span className="font-mono text-[10px] text-slate-400">
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
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
            <p className="mb-1.5 text-[10px] font-bold text-slate-400">
              หัวข้อที่ยังไม่ได้จัดลงสัปดาห์:
            </p>
            <ul className="space-y-0.5">
              {unassigned.map((t) => (
                <li
                  key={t.id}
                  className="list-inside list-disc text-xs text-slate-400"
                >
                  {t.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
        >
          แก้ไขเพิ่มเติม
        </button>
        <button
          onClick={onConfirm}
          className="rounded-xl bg-tu-red-500 px-5 py-2 text-xs font-bold text-white transition hover:bg-tu-red-600"
        >
          ยืนยันและส่งข้อมูล
        </button>
      </div>
    </Modal>
  );
}
