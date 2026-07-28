"use client";

import { useState } from "react";
import type { QuizPrompt } from "@/lib/quiz";
import { QUIZ_SOURCE_TOPICS, emptyPrompt } from "@/lib/quiz";

/**
 * ฟอร์มกรอกโจทย์เพื่อสั่ง generate ควิซ (ปรนัยล้วน)
 * CLO มาจากหัวข้อของสัปดาห์นั้นอัตโนมัติ (ล็อกไว้ ไม่ให้แก้) อาจารย์เลือกแค่หัวข้อ+ไฟล์ที่จะทดสอบ, จำนวนข้อ
 */
export default function QuizPromptForm({
  initial,
  sourceTopics = QUIZ_SOURCE_TOPICS,
  onGenerate,
}: {
  initial: QuizPrompt | null;
  /** รายการหัวข้อ/ไฟล์ให้เลือก (ค่าปริยาย = ทุกหัวข้อ mock) */
  sourceTopics?: { title: string; file: string }[];
  onGenerate: (prompt: QuizPrompt) => void;
}) {
  const [prompt, setPrompt] = useState<QuizPrompt>(initial ?? emptyPrompt());
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (prompt.count < 5) return setError("จำนวนข้อขั้นต่ำ 5 ข้อ");
    onGenerate(prompt);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CLO — มาจากหัวข้อของสัปดาห์นี้อัตโนมัติ ล็อกไว้ไม่ให้แก้ */}
      <div>
        <label className="label">
          ผลลัพธ์การเรียนรู้ (CLO) <span className="font-normal text-ink-400">จาก Course Syllabus</span>
        </label>
        <div className="mt-2 flex flex-col gap-2">
          {prompt.clo.length === 0 ? (
            <p className="text-sm text-ink-400">ไม่พบ CLO ที่เกี่ยวข้องกับหัวข้อของสัปดาห์นี้</p>
          ) : (
            prompt.clo.map((clo) => (
              <div
                key={clo}
                className="flex items-start gap-3 rounded-lg border border-tu-red-500 bg-tu-red-50 p-3"
              >
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-tu-red-500" />
                <span className="text-sm font-medium text-ink-700">{clo}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* หัวข้อ + ไฟล์ — หัวข้อทั้งหมดของสัปดาห์นี้ ล็อกไว้ไม่ให้แก้ */}
      <div>
        <label className="label">
          หัวข้อที่จะทดสอบ / ไฟล์อ้างอิง
        </label>
        <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
          {sourceTopics.map((t) => (
            <div
              key={t.file}
              className="flex items-start gap-2 rounded-lg bg-tu-red-50 p-2.5"
            >
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-tu-red-500" />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-ink-800">
                  {t.title}
                </span>
                <span className="block truncate text-[10px] text-ink-400">
                  {t.file}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* จำนวนข้อ */}
      <div>
        <label className="label">
          จำนวนข้อ
        </label>
        <input
          type="number"
          min={5}
          max={20}
          value={prompt.count}
          onChange={(e) =>
            setPrompt((p) => ({
              ...p,
              count: Math.min(20, Math.max(5, Number(e.target.value) || 5)),
            }))
          }
          className="field w-28"
        />
      </div>

      {/* รายละเอียด (ไม่บังคับ) */}
      <div>
        <label className="label">รายละเอียด</label>
        <textarea
          value={prompt.note}
          onChange={(e) => setPrompt((p) => ({ ...p, note: e.target.value }))}
          rows={2}
          placeholder="เช่น เน้นการประยุกต์ใช้ หลีกเลี่ยงการถามนิยามตรง ๆ"
          className="field resize-none"
        />
      </div>

      {error && <p className="alert-error">{error}</p>}

      <div className="flex justify-end border-t border-line-soft pt-5">
        <button type="submit" className="btn-primary px-6">
          สร้างแบบทดสอบ
        </button>
      </div>
    </form>
  );
}
