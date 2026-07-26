"use client";

import type { Topic } from "@/lib/types";
import type { WeekSummary } from "@/lib/useTopics";
import { buildPlanPayload } from "@/lib/planPayload";
import Modal, { ModalHeader } from "@/components/ui/Modal";
import { resolveHex } from "@/lib/weeks";

/** ป็อปอัปสรุปการจัดกลุ่มหัวข้อทั้งหมดก่อนยืนยันส่ง */
export default function SummaryPopup({
  open,
  topics,
  weekSummaries,
  courseId,
  courseCode,
  subject,
  onClose,
  onConfirm,
}: {
  open: boolean;
  topics: Topic[];
  weekSummaries: WeekSummary[];
  courseId: string;
  courseCode: string | null;
  subject: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const unassigned = topics.filter((t) => t.weekAssigned === null);
  const payload = buildPlanPayload(courseId, courseCode, subject, topics);

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
                        {t.title}
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

      {/* payload ที่จะส่งให้ backend ตอนกด "ยืนยันและส่งข้อมูล" — ยังไม่มี endpoint จริง
          ให้ preview ไว้ก่อนต่อสาย API จริง */}
      <details className="group mb-4 rounded-lg border border-line-soft bg-paper-50">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-ink-600 [&::-webkit-details-marker]:hidden">
          <span>ดู payload ที่จะส่งไป backend (JSON)</span>
          <ChevronIcon className="transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-line-soft p-3">
          <pre className="max-h-56 overflow-auto rounded-md bg-ink-900 p-3 text-[11px] leading-relaxed text-paper-100">
            {JSON.stringify(payload, null, 2)}
          </pre>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(JSON.stringify(payload, null, 2))}
            className="mt-2 text-[11px] font-semibold text-tu-red-600 hover:underline"
          >
            คัดลอก JSON
          </button>
        </div>
      </details>

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

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-3.5 w-3.5 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}
