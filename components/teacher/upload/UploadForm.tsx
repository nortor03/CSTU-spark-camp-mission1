"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCourse, topicsFromSyllabusSchedule } from "@/lib/courseStore";
import { extractSyllabus, type SyllabusExtraction } from "@/lib/syllabus";
import {
  buildMockCourseSeed,
  USE_MOCK_COURSE_PREVIEW,
} from "@/lib/mockCourseSeed";
import { buildPlanPayload } from "@/lib/planPayload";
import { createCourse } from "@/lib/coursesApi";
import FileDropzone from "./FileDropzone";
import SyllabusUpload from "./SyllabusUpload";
import AiLoading from "@/components/ui/AiLoading";

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
  const { addCourse, subject: activeSubject } = useCourse();

  const [courseCode, setCourseCode] = useState("");
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
    if (isNew && !syllabus) {
      setError("กรุณาแนบ course syllabus (PDF) — ใช้แยกหัวข้อและ CLO ของวิชา");
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

      if (USE_MOCK_COURSE_PREVIEW) {
        // ───────── โหมดพรีวิว mock (ชั่วคราว — ระหว่างทำ UI/UX) ─────────
        // สร้างวิชาพร้อมข้อมูลจำลอง เพื่อให้หน้าจัดหัวข้อ (/topics) และหน้ารายละเอียด
        // วิชา (/course/[id]) มีเนื้อหาให้ดู/แก้ทันที — ตั้ง USE_MOCK_COURSE_PREVIEW=false
        // ใน lib/mockCourseSeed.ts เมื่อหลังบ้านพร้อม เพื่อสลับไปใช้ path จริงด้านล่าง
        const seed = buildMockCourseSeed(syllabus?.name ?? null);
        // ใช้รหัสวิชาที่อาจารย์กรอก (ถ้ามี) แทนรหัสจำลอง
        if (courseCode.trim()) seed.extraction.course_code = courseCode.trim();

        let backendCourseId: string | undefined;
        try {
          const created = await createCourse(
            buildPlanPayload(
              seed.extraction.course_code,
              subject.trim(),
              seed.extraction.clos,
              seed.topics,
            ),
          );
          backendCourseId = created.course_id;
        } catch (err) {
          console.error("สร้างวิชาที่ backend ไม่สำเร็จ (best-effort ในโหมด mock)", err);
        }

        addCourse(
          subject.trim(),
          syllabus?.name ?? null,
          syllabusData,
          seed.topics,
          seed.extraction,
          backendCourseId,
          seed.quizzes,
        );
      } else {
        // ───────── โหมดจริง (หลังบ้านพร้อมแล้ว) ─────────
        // แยก CLO/ตารางสอนจาก syllabus จริง — ถ้าแยกไม่ได้/ไม่มีข้อมูล หัวข้อจะว่าง
        // และหน้าเว็บจะขึ้น "สถานะว่าง" ตามปกติ (ไม่มีข้อมูลจำลองมาแทน)
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

        // หัวข้อของวิชามาจากการแยก syllabus จริงเท่านั้น (หัวข้อที่มีเลขสัปดาห์กำกับ
        // จะถูกจัดเข้าสัปดาห์อัตโนมัติ ที่เหลือไปกองยังไม่จัด) — แยกไม่สำเร็จ = ไม่มีหัวข้อ
        const initialTopics = extraction
          ? topicsFromSyllabusSchedule(extraction, syllabus?.name ?? null)
          : [];

        // รหัสวิชาที่อาจารย์กรอกเองมีความสำคัญกว่าที่แกะได้จาก syllabus
        const finalCourseCode =
          courseCode.trim() || extraction?.course_code || null;
        if (extraction) extraction.course_code = finalCourseCode;

        // สร้างวิชาที่ backend ก่อน (POST) เพื่อให้ id ตรงกันตั้งแต่ต้น — ล้มเหลวก็ยัง
        // สร้างในเครื่องต่อได้ แล้ว sync ใหม่ตอนกด "ยืนยันและส่งข้อมูล" ในหน้าจัดหัวข้อ
        let backendCourseId: string | undefined;
        try {
          const created = await createCourse(
            buildPlanPayload(
              finalCourseCode,
              subject.trim(),
              extraction?.clos ?? [],
              initialTopics,
            ),
          );
          backendCourseId = created.course_id;
        } catch (err) {
          console.error("สร้างวิชาที่ backend ไม่สำเร็จ (จะ sync ใหม่ตอนยืนยันข้อมูล)", err);
        }

        addCourse(
          subject.trim(),
          syllabus?.name ?? null,
          syllabusData,
          initialTopics,
          extraction,
          backendCourseId,
        );
      }
    } else {
      // อัปสไลด์เพิ่มเติม — ไม่สร้างหัวข้อใหม่
      // (หัวข้อของวิชายึดตาม course syllabus ที่แนบไว้ตอนสร้างวิชา)
    }

    router.push("/topics");
  }

  // ระหว่างส่งเอกสารให้ AI วิเคราะห์ — แสดงหน้าโหลด (เอกสารไหลเข้าหาบอท)
  if (loading) {
    return (
      <AiLoading
        title={extracting ? "กำลังแยก CLO จาก syllabus" : "กำลังวิเคราะห์สไลด์"}
        subtitle="AI กำลังอ่านเอกสารและจับหัวข้อการสอน"
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isNew ? (
        <>
          {/* รหัสวิชา + ชื่อวิชา + Course Syllabus อยู่แถวเดียวกัน (สไลด์อยู่แถวถัดไป) */}
          <div className="grid items-start gap-4 sm:grid-cols-[130px_1.6fr_1fr]">
            <div>
              <label className="label">รหัสวิชา</label>
              <input
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="เช่น CN101"
                maxLength={14}
                className="field text-sm"
              />
            </div>

            <div>
              <label className="label">ชื่อวิชา</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="เช่น การเขียนโปรแกรม"
                className="field text-sm"
              />
            </div>

            <div>
              <label className="label">
                Course Syllabus{" "}
                <span className="font-normal text-ink-400">(PDF)</span>
                <span className="text-tu-red-500"> *</span>
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
            <p className="mt-2 text-xs text-ink-400">
              หมายเหตุ: หัวข้อของวิชายึดตาม course syllabus เดิม —
              การเพิ่มสไลด์จะไม่สร้างหัวข้อใหม่
            </p>
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
              ? "สร้างรายวิชา"
              : "เพิ่มสไลด์"}
        </button>
      </div>
    </form>
  );
}
