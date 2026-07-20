"use client";

import { useRef } from "react";

/**
 * ตัวอัปโหลดไฟล์ course syllabus แบบกะทัดรัด (สูงสุด 1 ไฟล์)
 * เลือกไฟล์ใหม่จะแทนที่ไฟล์เดิมเสมอ
 */
export default function SyllabusUpload({
  file,
  onFileChange,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(list: FileList | null) {
    if (!list || list.length === 0) return;
    const f = list[0];
    const ok =
      f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!ok) return;
    onFileChange(f); // max 1 — แทนที่ไฟล์เดิม
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {file ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-3.5 py-2.5">
          <span className="flex min-w-0 items-center gap-2">
            <svg
              className="h-4 w-4 flex-shrink-0 text-tu-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span className="truncate text-sm text-ink-700">{file.name}</span>
          </span>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="rounded-md px-2 py-0.5 text-xs font-semibold text-ink-400 transition hover:bg-tu-red-50 hover:text-tu-red-600"
          >
            ลบ
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-line-strong bg-paper-50 px-3.5 py-2.5 text-sm text-ink-500 transition hover:border-tu-red-300 hover:bg-tu-red-50/40"
        >
          <svg
            className="h-5 w-5 flex-shrink-0 text-ink-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            />
          </svg>
          <span>
            แนบไฟล์{" "}
            <span className="font-semibold text-tu-red-600">
              course syllabus
            </span>
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
    </div>
  );
}
