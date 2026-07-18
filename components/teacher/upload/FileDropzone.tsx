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
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver
            ? "border-tu-red-500 bg-tu-red-50"
            : "border-slate-200 bg-slate-50/60 hover:border-tu-red-300 hover:bg-tu-red-50/40"
        }`}
      >
        <svg
          className="h-10 w-10 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3"
          />
        </svg>
        <p className="text-sm font-medium text-slate-600">
          ลากและวางไฟล์ หรือ <span className="text-tu-red-600">เลือกไฟล์</span>
        </p>
        <p className="text-xs text-slate-400">รองรับเฉพาะไฟล์ PDF เท่านั้น</p>
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
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
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
                <span className="truncate text-xs text-slate-600">
                  {file.name}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="rounded-md px-2 py-0.5 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-tu-red-600"
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
