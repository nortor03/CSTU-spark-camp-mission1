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
  const frictionInsight = insights.find((i) => i.type === "friction") || insights[0];
  const otherInsights = insights.filter((i) => i.id !== frictionInsight.id);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="card flex flex-col overflow-hidden p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="display text-xl sm:text-2xl font-bold tracking-tight text-ink-900">สรุปข้อสังเกต</h2>
        <span className="rounded-full bg-tu-blue-100 px-3 py-1 text-xs font-bold text-tu-blue-700 bg-blue-50 text-blue-600">
          AI Insights
        </span>
      </div>

      <div className="flex-1 space-y-5">
        {/* Critical Friction Point */}
        <div className="rounded-r-lg border-l-4 border-tu-red-500 bg-tu-red-50 p-4 relative">
          <p className="mb-2 text-xs font-bold text-tu-red-600">
            จุดที่สับสนมากที่สุด (Critical Friction Point)
          </p>
          <p className="text-[15px] leading-relaxed text-ink-800">
            {frictionInsight.description}
            <span className="font-semibold ml-1">
              พบจากนักศึกษา {frictionInsight.studentCount} คน
            </span>
          </p>
        </div>

        {/* Other Insights as Bullet Points */}
        <ul className="space-y-4 px-2">
          {otherInsights.map((insight, i) => {
            const colors = [
              "bg-emerald-500",
              "bg-tu-gold-600",
              "bg-blue-500",
              "bg-purple-500",
            ];
            const dotColor = colors[i % colors.length];
            
            return (
              <li key={insight.id} className="flex items-start gap-3">
                <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColor}`} aria-hidden />
                <p className="text-sm leading-relaxed text-ink-700">
                  {insight.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6 pt-4">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full rounded-lg border border-line-soft bg-white py-2.5 text-sm font-bold text-ink-700 shadow-sm transition-colors hover:bg-paper-50"
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
