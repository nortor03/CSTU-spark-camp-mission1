"use client";

import { useState } from "react";
import type { QuizPrompt } from "@/lib/quiz";
import { QUIZ_SOURCE_TOPICS, emptyPrompt } from "@/lib/quiz";

/**
 * ฟอร์มกรอกโจทย์เพื่อสั่ง generate ควิซ (ปรนัยล้วน)
 * อาจารย์กรอก CLO, เลือกหัวข้อ+ไฟล์ที่จะทดสอบ, จำนวนข้อ
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

  /** เลือก/ยกเลิกหัวข้อ (เก็บทั้งชื่อหัวข้อและไฟล์คู่กัน) */
  function toggleTopic(title: string, file: string) {
    setPrompt((p) => {
      const has = p.topics.includes(title);
      return {
        ...p,
        topics: has
          ? p.topics.filter((t) => t !== title)
          : [...p.topics, title],
        files: has ? p.files.filter((f) => f !== file) : [...p.files, file],
      };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!prompt.clo.trim()) return setError("กรุณากรอก CLO");
    if (prompt.topics.length === 0)
      return setError("กรุณาเลือกหัวข้อที่จะทดสอบอย่างน้อย 1 หัวข้อ");
    if (prompt.count < 1) return setError("จำนวนข้อต้องมากกว่า 0");
    onGenerate(prompt);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CLO */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          ผลลัพธ์การเรียนรู้ (CLO)
        </label>
        <textarea
          value={prompt.clo}
          onChange={(e) => setPrompt((p) => ({ ...p, clo: e.target.value }))}
          rows={2}
          placeholder="เช่น นักศึกษาสามารถอธิบายหลักการเขียนโปรแกรมเชิงโครงสร้างได้"
          className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-tu-red-500 focus:ring-2 focus:ring-tu-red-100"
        />
      </div>

      {/* หัวข้อ + ไฟล์ */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          หัวข้อที่จะทดสอบ / ไฟล์อ้างอิง
        </label>
        <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-2">
          {sourceTopics.map((t) => {
            const checked = prompt.topics.includes(t.title);
            return (
              <label
                key={t.file}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition ${
                  checked
                    ? "border-tu-red-300 bg-tu-red-50/50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTopic(t.title, t.file)}
                  className="mt-0.5 h-4 w-4 accent-tu-red-500"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-700">
                    {t.title}
                  </span>
                  <span className="block truncate font-mono text-[10px] text-slate-400">
                    {t.file}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* จำนวนข้อ */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          จำนวนข้อ
        </label>
        <input
          type="number"
          min={1}
          max={30}
          value={prompt.count}
          onChange={(e) =>
            setPrompt((p) => ({ ...p, count: Number(e.target.value) }))
          }
          className="w-28 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-tu-red-500 focus:ring-2 focus:ring-tu-red-100"
        />
      </div>

      {/* โน้ตเพิ่มเติม */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          โน้ตเพิ่มเติม (ไม่บังคับ)
        </label>
        <textarea
          value={prompt.note}
          onChange={(e) => setPrompt((p) => ({ ...p, note: e.target.value }))}
          rows={2}
          placeholder="เช่น เน้นการประยุกต์ใช้ หลีกเลี่ยงการถามนิยามตรง ๆ"
          className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-tu-red-500 focus:ring-2 focus:ring-tu-red-100"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-tu-red-50 px-3 py-2 text-xs font-medium text-tu-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <button
          type="submit"
          className="rounded-xl bg-tu-red-500 px-6 py-2 text-sm font-bold text-white transition hover:bg-tu-red-600"
        >
          สร้างควิซ
        </button>
      </div>
    </form>
  );
}
