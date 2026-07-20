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
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">ชื่อวิชา</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="เช่น CN101 การเขียนโปรแกรม"
            className="field text-sm"
          />
        </div>

        <div>
          <label className="label">
            Course Syllabus{" "}
            <span className="font-normal text-ink-400">(PDF · 1 ไฟล์)</span>
          </label>
          <SyllabusUpload file={syllabus} onFileChange={setSyllabus} />
        </div>
      </div>

      <div>
        <label className="label">ไฟล์เอกสารการสอน (PDF)</label>
        <FileDropzone files={files} onFilesChange={setFiles} />
      </div>

      {error && <p className="alert-error">{error}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-line-soft pt-5">
        <button
          type="button"
          onClick={() => router.push("/course")}
          className="btn-ghost"
        >
          ยกเลิก
        </button>
        <button type="submit" disabled={loading} className="btn-primary px-6">
          {loading ? "กำลังประมวลผล…" : "จับหัวข้อด้วย AI"}
        </button>
      </div>
    </form>
  );
}
