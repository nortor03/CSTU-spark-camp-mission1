"use client";

import { useState } from "react";
import type { QuizPrompt } from "@/lib/quiz";
import { QUIZ_SOURCE_TOPICS, emptyPrompt, MOCK_CLOS } from "@/lib/quiz";

/**
 * ฟอร์มกรอกโจทย์เพื่อสั่ง generate ควิซ (ปรนัยล้วน)
 * อาจารย์กรอก CLO, เลือกหัวข้อ+ไฟล์ที่จะทดสอบ, จำนวนข้อ
 */
export default function QuizPromptForm({
  initial,
  sourceTopics = QUIZ_SOURCE_TOPICS,
  cloOptions = MOCK_CLOS,
  onGenerate,
}: {
  initial: QuizPrompt | null;
  /** รายการหัวข้อ/ไฟล์ให้เลือก (ค่าปริยาย = ทุกหัวข้อ mock) */
  sourceTopics?: { title: string; file: string }[];
  /** รายการ CLO ให้เลือก (ค่าปริยาย = mock CLO เมื่อวิชายังไม่มีผลแยกจาก syllabus) */
  cloOptions?: string[];
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
    if (prompt.clo.length === 0) return setError("กรุณาเลือก CLO อย่างน้อย 1 ข้อ");
    if (prompt.topics.length === 0)
      return setError("กรุณาเลือกหัวข้อที่จะทดสอบอย่างน้อย 1 หัวข้อ");
    if (prompt.count < 1) return setError("จำนวนข้อต้องมากกว่า 0");
    onGenerate(prompt);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CLO */}
      <div>
        <label className="label">
          ผลลัพธ์การเรียนรู้ (CLO) <span className="font-normal text-ink-400">จาก Course Syllabus</span>
        </label>
        <div className="mt-2 flex flex-col gap-2">
          {cloOptions.map((clo) => {
            const selected = prompt.clo.includes(clo);
            return (
              <label
                key={clo}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                  selected
                    ? "border-tu-red-500 bg-tu-red-50"
                    : "border-line bg-paper-100 hover:border-line-strong hover:bg-paper-200"
                }`}
              >
                <input
                  type="checkbox"
                  name="clo"
                  value={clo}
                  checked={selected}
                  onChange={() => {
                    setPrompt((p) => {
                      const has = p.clo.includes(clo);
                      return {
                        ...p,
                        clo: has
                          ? p.clo.filter((c) => c !== clo)
                          : [...p.clo, clo],
                      };
                    });
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded text-tu-red-500 accent-tu-red-500"
                />
                <span className="text-sm font-medium text-ink-700">{clo}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* หัวข้อ + ไฟล์ */}
      <div>
        <label className="label">
          หัวข้อที่จะทดสอบ / ไฟล์อ้างอิง
        </label>
        <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
          {sourceTopics.map((t) => {
            const checked = prompt.topics.includes(t.title);
            return (
              <label
                key={t.file}
                className={`flex cursor-pointer items-start gap-2 rounded-lg p-2.5 transition ${
                  checked
                    ? "bg-tu-red-50"
                    : "bg-paper-100 hover:bg-paper-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTopic(t.title, t.file)}
                  className="mt-0.5 h-4 w-4 accent-tu-red-500"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-ink-800">
                    {t.title}
                  </span>
                  <span className="block truncate text-[10px] text-ink-400">
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
        <label className="label">
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
          className="field w-28"
        />
      </div>

      {/* รายละเอียด */}
      <div>
        <label className="label">
          รายละเอียด (ไม่บังคับ)
        </label>
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
