"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCourse,
  freshTopics,
  topicsFromSyllabusSchedule,
} from "@/lib/courseStore";
import { extractSyllabus, type SyllabusExtraction } from "@/lib/syllabus";
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
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isNew = mode === "new";

  /** เลือกไฟล์ syllabus ใหม่ — ยังไม่ยิง extraction ตอนนี้ รอกดสร้างวิชาก่อน */
  function onSyllabusFileChange(file: File | null) {
    setSyllabus(file);
    setExtractError("");
  }

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

      // ยิงไปแยก CLO/ตารางสอน/เกณฑ์ประเมินจาก syllabus ตอนกดสร้างวิชาเลย
      let extraction: SyllabusExtraction | null = null;
      if (syllabus) {
        setExtracting(true);
        setExtractError("");
        try {
          extraction = await extractSyllabus(syllabus);
        } catch {
          setExtractError(
            "แยกข้อมูลจาก syllabus ไม่สำเร็จ — สร้างวิชาต่อได้ แต่ยังไม่มี CLO",
          );
        } finally {
          setExtracting(false);
        }
      }

      // ถ้า syllabus แกะหัวข้อออกมาได้ ใช้ชุดนั้นแทนหัวข้อจำลอง — หัวข้อที่มีเลขสัปดาห์
      // กำกับจะถูกจัดเข้าสัปดาห์ให้อัตโนมัติ ส่วนที่ไม่มีเลขสัปดาห์จะไปอยู่ในกองที่ยังไม่จัด
      // ให้ลากจัดเอง (ไม่ได้ขึ้นกับ has_weekly_schedule เพราะแม้เอกสารจะไม่ได้จัดเป็นรายสัปดาห์
      // ทั้งฉบับ ก็ยังอาจมีบางหัวข้อที่ระบุสัปดาห์ไว้ได้)
      // หมายเหตุ: บางแถวมีแค่เลขสัปดาห์แต่ไม่มีชื่อหัวข้อ ถูกกรองทิ้งใน
      // topicsFromSyllabusSchedule แล้ว — ถ้ากรองแล้วว่างเปล่า ให้ fallback ไปหัวข้อจำลอง
      const syllabusTopics = extraction
        ? topicsFromSyllabusSchedule(extraction, syllabus?.name ?? null)
        : [];
      const initialTopics =
        syllabusTopics.length > 0 ? syllabusTopics : undefined;

      addCourse(
        subject.trim(),
        syllabus?.name ?? null,
        syllabusData,
        initialTopics,
        extraction,
      );
    } else {
      // เพิ่มหัวข้อชุดใหม่ (จำลองผลวิเคราะห์สไลด์) เข้าวิชาที่กำลังเปิดอยู่
      addTopics(freshTopics());
    }

    router.push("/topics");
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
              <SyllabusUpload
                file={syllabus}
                onFileChange={onSyllabusFileChange}
              />

              {extracting && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-line-strong border-t-tu-red-500" />
                  กำลังแยก CLO และตารางสอนจาก syllabus…
                </p>
              )}

              {extractError && (
                <p className="mt-2 text-xs text-tu-red-600">{extractError}</p>
              )}
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
            ? extracting
              ? "กำลังแยก CLO จาก syllabus…"
              : "กำลังประมวลผล…"
            : isNew
              ? "สร้างรายวิชา + จับหัวข้อด้วย AI"
              : "จับหัวข้อจากสไลด์"}
        </button>
      </div>
    </form>
  );
}
