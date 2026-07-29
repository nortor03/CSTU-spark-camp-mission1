"use client";

import { useState } from "react";
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
  const frictionInsight = insights.find((i) => i.type === "friction") || insights[0];
  const otherInsights = insights.filter((i) => i.id !== frictionInsight.id);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="flex flex-col">
      <h2 className="display text-lg">สรุป feedback</h2>

      <div className="mt-4 flex-1 space-y-5">
        {/* จุดที่สับสนมากที่สุด */}
        <div className="border-l-2 border-tu-red-300 pl-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-tu-red-600">
            จุดที่สับสนมากที่สุด
          </p>
          <p className="text-sm leading-relaxed text-ink-700">
            {frictionInsight.description}
            <span className="font-semibold text-ink-900 ml-1">
              พบจากนักศึกษา {frictionInsight.studentCount} คน
            </span>
          </p>
        </div>

        {/* ข้อสังเกตอื่น ๆ */}
        <ul className="space-y-3">
          {otherInsights.map((insight) => (
            <li key={insight.id} className="flex items-start gap-2.5">
              <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-ink-300" aria-hidden />
              <p className="text-sm leading-relaxed text-ink-700">
                {insight.description}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-sm font-semibold text-ink-500 underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink-800"
        >
          ดูสรุปทั้งหมด {insights.reduce((acc, i) => acc + i.studentCount, 0)} รายการ
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="relative flex w-full max-w-2xl max-h-[85vh] flex-col rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h3 className="text-lg font-bold text-ink-900">หลักฐานข้อสังเกตจาก AI (Evidence)</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-400 transition hover:bg-paper-100 hover:text-ink-600"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <div className="space-y-6">
                {insights.map((insight, i) => (
                  <div key={insight.id} className="rounded-lg border border-line bg-paper-50 p-4">
                    <h4 className="font-bold text-tu-red-600">{i + 1}. {insight.headline}</h4>
                    <p className="mt-1 text-sm text-ink-700">{insight.description}</p>
                    <div className="mt-4 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                        หลักฐานจากนักศึกษา ({insight.studentCount} คน)
                      </p>
                      <ul className="space-y-2">
                        {insight.evidence.map((e) => (
                          <li key={e.studentId} className="rounded border border-line-soft bg-white p-3 text-xs shadow-sm">
                            <span className="font-semibold text-ink-800">{e.studentName}</span>
                            <span className="text-ink-400 ml-2">{e.studentId}</span>
                            <p className="mt-1.5 text-ink-600 bg-paper-50 p-2 rounded">{e.detail}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
