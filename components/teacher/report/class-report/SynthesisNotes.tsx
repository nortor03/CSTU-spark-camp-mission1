"use client";

import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import type { ClassInsight } from "@/lib/analytics";

/**
 * "สรุปข้อสังเกต" (ฝั่งอาจารย์)
 * แสดงข้อสังเกตระดับชั้นเรียนที่สังเคราะห์มาจาก Student Summary ของนักศึกษาทุกคน
 * แต่ละข้อกดขยายดู Evidence ได้ว่าอ้างอิงจากนักศึกษาคนไหน พร้อมข้อความดั้งเดิม
 */
export default function SynthesisNotes({
  insights,
}: {
  insights: ClassInsight[];
}) {
  const [openId, setOpenId] = useState<string | null>(
    insights[0]?.id ?? null,
  );

  if (insights.length === 0) {
    return (
      <section className="card mb-4 overflow-hidden">
        <div className="h-1 bg-tu-gold-500" aria-hidden />
        <div className="p-5 sm:p-6">
          <h2 className="display text-lg">สรุปข้อสังเกต</h2>
          <hr className="rule-gold my-4" />
          <p className="text-sm text-ink-500">
            ยังไม่พบความเข้าใจคลาดเคลื่อนร่วมที่ชัดเจนพอจะสรุปเป็นข้อสังเกตระดับชั้นเรียน
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="card mb-4 overflow-hidden">
      <div className="h-1 bg-tu-gold-500" aria-hidden />
      <div className="p-5 sm:p-6">
        <h2 className="display text-lg">สรุปข้อสังเกต</h2>
        <p className="mt-1 text-xs text-ink-500">
          สังเคราะห์จากผลสรุปรายบุคคล (Student Summary) ของนักศึกษาทั้งห้อง —
          กดที่ข้อสังเกตเพื่อดู Evidence ว่ามาจากใครบ้าง
        </p>
        <hr className="rule-gold my-4" />

        <ul className="space-y-2.5">
          {insights.map((insight, i) => {
            const isOpen = openId === insight.id;
            return (
              <li
                key={insight.id}
                className="overflow-hidden rounded-md border border-line-soft bg-paper-50"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : insight.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-3 px-3.5 py-2.5 text-left"
                >
                  <span className="flex-shrink-0 font-bold text-tu-red-600">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-relaxed text-ink-700">
                      {insight.headline}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-500">
                      {insight.description}
                    </span>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-tu-gold-100 px-2 py-0.5 text-[10px] font-bold text-tu-gold-700">
                      <Users size={11} aria-hidden />
                      อ้างอิงจากนักศึกษา {insight.studentCount} คน
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className={`mt-1 flex-shrink-0 text-ink-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-line-soft bg-paper-0 px-3.5 py-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                      Evidence
                    </p>
                    <ul className="space-y-2">
                      {insight.evidence.map((e) => (
                        <li
                          key={e.studentId}
                          className="rounded-md bg-paper-50 px-3 py-2 text-xs leading-relaxed"
                        >
                          <span className="font-semibold text-ink-800">
                            {e.studentName}
                          </span>
                          <span className="text-ink-400"> · {e.studentId}</span>
                          <p className="mt-0.5 text-ink-600">{e.detail}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
