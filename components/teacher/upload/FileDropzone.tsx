"use client";

import { useRef, useState } from "react";

/** พื้นที่ลาก-วางหรือเลือกไฟล์ PDF */
export default function FileDropzone({
  files,
  onFilesChange,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const pdfs = Array.from(list).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (pdfs.length === 0) return;
    onFilesChange([...files, ...pdfs]);
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center transition ${
          dragOver
            ? "border-tu-red-500 bg-tu-red-50"
            : "border-line-strong bg-paper-50 hover:border-tu-red-300 hover:bg-tu-red-50/40"
        }`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-tu-red-500 shadow-card">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            />
          </svg>
        </span>
        <p className="mt-1 text-sm font-semibold text-ink-700">
          ลากและวางไฟล์ หรือ{" "}
          <span className="text-tu-red-600 underline decoration-tu-red-200 underline-offset-4">
            เลือกไฟล์
          </span>
        </p>
        <p className="text-xs text-ink-400">รองรับเฉพาะไฟล์ PDF เท่านั้น</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2"
            >
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
                <span className="truncate text-xs text-ink-700">
                  {file.name}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="rounded-md px-2 py-0.5 text-xs font-semibold text-ink-400 transition hover:bg-tu-red-50 hover:text-tu-red-600"
              >
                ลบ
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
