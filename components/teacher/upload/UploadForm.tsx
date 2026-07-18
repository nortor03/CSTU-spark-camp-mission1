"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import FileDropzone from "./FileDropzone";
import SyllabusUpload from "./SyllabusUpload";

/** อ่านไฟล์เป็น data URL (base64) เพื่อเก็บ/ดาวน์โหลดภายหลัง */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * ฟอร์มอัปโหลดเอกสารการสอน (ตาม wireframe)
 * - ชื่อวิชา (subject) + ไฟล์ PDF
 * - กด "จับหัวข้อ" เพื่อจำลองให้ AI แยกหัวข้อ แล้วไปหน้าสรุปหัวข้อ
 */
export default function UploadForm() {
  const router = useRouter();
  const { startCourse } = useCourse();
  const [subject, setSubject] = useState("");
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!subject.trim()) {
      setError("กรุณากรอกชื่อวิชา");
      return;
    }
    if (files.length === 0) {
      setError("กรุณาแนบไฟล์ PDF อย่างน้อย 1 ไฟล์");
      return;
    }

    setLoading(true);
    // เก็บเนื้อไฟล์ syllabus เป็น data URL เพื่อให้ดาวน์โหลดได้ภายหลัง
    const syllabusData = syllabus ? await fileToDataUrl(syllabus) : null;
    // บันทึกวิชา + syllabus ลง store แล้วจำลองให้ AI แยกหัวข้อ ก่อนไปหน้าจัดหัวข้อ
    startCourse(subject.trim(), syllabus?.name ?? null, syllabusData);
    setTimeout(() => {
      router.push("/topics");
    }, 800);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            ชื่อวิชา (subject)
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="– กรอกข้อมูล –"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-tu-red-500 focus:ring-2 focus:ring-tu-red-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Course Syllabus{" "}
            <span className="font-normal text-slate-400">(PDF · 1 ไฟล์)</span>
          </label>
          <SyllabusUpload file={syllabus} onFileChange={setSyllabus} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          ไฟล์เอกสาร (PDF)
        </label>
        <FileDropzone files={files} onFilesChange={setFiles} />
      </div>

      {error && (
        <p className="rounded-lg bg-tu-red-50 px-3 py-2 text-xs font-medium text-tu-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-tu-red-500 px-6 py-2 text-sm font-bold text-white transition hover:bg-tu-red-600 disabled:opacity-60"
        >
          {loading ? "กำลังประมวลผล…" : "ยืนยัน"}
        </button>
      </div>
    </form>
  );
}
