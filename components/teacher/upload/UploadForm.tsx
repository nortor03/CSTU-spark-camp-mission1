"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCourse, freshTopics } from "@/lib/courseStore";
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
 * ฟอร์มอัปโหลดเอกสาร — มี 2 โหมด
 * - "new"    : สร้างรายวิชาใหม่ (ชื่อวิชา + สไลด์ + course syllabus)
 * - "slides" : อัปโหลดสไลด์เพิ่มให้วิชาที่มีอยู่แล้ว (เฉพาะสไลด์)
 */
export default function UploadForm({ mode }: { mode: "new" | "slides" }) {
  const router = useRouter();
  const { addCourse, addTopics, subject: activeSubject } = useCourse();

  const [subject, setSubject] = useState("");
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isNew = mode === "new";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isNew && !subject.trim()) {
      setError("กรุณากรอกชื่อวิชา");
      return;
    }
    if (files.length === 0) {
      setError("กรุณาแนบไฟล์สไลด์ (PDF) อย่างน้อย 1 ไฟล์");
      return;
    }

    setLoading(true);

    if (isNew) {
      // เก็บ syllabus เป็น data URL เพื่อให้ดาวน์โหลดได้ภายหลัง
      const syllabusData = syllabus ? await fileToDataUrl(syllabus) : null;
      // สร้างวิชาใหม่ + จำลองให้ AI แยกหัวข้อจากสไลด์ (freshTopics)
      addCourse(subject.trim(), syllabus?.name ?? null, syllabusData);
    } else {
      // เพิ่มหัวข้อชุดใหม่ (จำลองผลวิเคราะห์สไลด์) เข้าวิชาที่กำลังเปิดอยู่
      addTopics(freshTopics());
    }

    setTimeout(() => router.push("/topics"), 700);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isNew ? (
        <>
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
                <span className="font-normal text-ink-400">
                  (PDF · ไม่บังคับ)
                </span>
              </label>
              <SyllabusUpload file={syllabus} onFileChange={setSyllabus} />
            </div>
          </div>

          <div>
            <label className="label">สไลด์ประกอบการสอน (PDF)</label>
            <FileDropzone files={files} onFilesChange={setFiles} />
          </div>
        </>
      ) : (
        <>
          {activeSubject && (
            <p className="rounded-lg border border-line bg-paper-50 px-3.5 py-2.5 text-xs text-ink-600">
              กำลังเพิ่มสไลด์เข้าวิชา{" "}
              <span className="font-semibold text-ink-800">
                {activeSubject}
              </span>
            </p>
          )}
          <div>
            <label className="label">สไลด์ที่ต้องการเพิ่ม (PDF)</label>
            <FileDropzone files={files} onFilesChange={setFiles} />
          </div>
        </>
      )}

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
          {loading
            ? "กำลังประมวลผล…"
            : isNew
              ? "สร้างรายวิชา + จับหัวข้อด้วย AI"
              : "จับหัวข้อจากสไลด์"}
        </button>
      </div>
    </form>
  );
}
