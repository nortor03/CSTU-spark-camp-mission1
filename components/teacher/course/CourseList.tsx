"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteCourse, fetchCourses, type CourseSummary } from "@/lib/coursesApi";
import PageHeader from "@/components/ui/PageHeader";
import Modal, { ModalHeader } from "@/components/ui/Modal";
import { ChevronRight, Trash2 } from "lucide-react";

/**
 * หน้าภาพรวมรายวิชา — สรุป "ทุกวิชา" ที่อาจารย์คนนี้สอน
 * ดึงจาก backend รายวิชา (GET /api/v1/courses) โดยตรง
 * กดการ์ดวิชาเพื่อเข้าไปดูรายละเอียดของวิชานั้น
 */
export default function CourseList() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">(
    "loading",
  );
  const [deleteTarget, setDeleteTarget] = useState<CourseSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchCourses()
      .then((items) => {
        if (cancelled) return;
        setCourses(items);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCourse(deleteTarget.course_id);
      setCourses((prev) =>
        prev.filter((c) => c.course_id !== deleteTarget.course_id),
      );
      setDeleteTarget(null);
    } catch {
      setDeleteError("ลบวิชาไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setDeleting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="grid place-items-center py-24 text-sm text-tu-red-600">
        โหลดรายวิชาไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="หน้าแรก"
        title="รายวิชาทั้งหมด"
        action={
          courses.length > 0 ? (
            <Link href="/course/new" className="btn-primary">
              + เพิ่มรายวิชาใหม่
            </Link>
          ) : undefined
        }
      />

      {courses.length === 0 ? (
        <div className="card-empty">
          <p className="eyebrow">เริ่มต้นใช้งาน</p>
          <h2 className="display mt-1.5 text-xl">ยังไม่มีรายวิชา</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            สร้างรายวิชาแรกโดยกรอกชื่อวิชาและอัปโหลดสไลด์
            ระบบจะช่วยแยกหัวข้อการสอนให้อัตโนมัติ
          </p>
          <Link href="/course/new" className="btn-primary mt-5">
            + เพิ่มรายวิชาใหม่
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-line border-y border-line">
          {courses.map((c) => (
            <CourseCard
              key={c.course_id}
              course={c}
              onDeleteClick={() => setDeleteTarget(c)}
            />
          ))}
        </div>
      )}

      {/* ป็อปอัปยืนยันการลบวิชา */}
      <Modal open={deleteTarget !== null} onClose={closeDeleteModal}>
        {deleteTarget && (
          <>
            <ModalHeader title="ยืนยันการลบ" />
            <p className="text-sm leading-relaxed text-ink-600">
              ต้องการลบวิชา “{deleteTarget.subject}” ใช่ไหม? หัวข้อและ CLO
              ทั้งหมดของวิชานี้จะถูกลบไปด้วย การลบนี้ย้อนกลับไม่ได้
            </p>
            {deleteError && (
              <p className="mt-3 rounded-lg bg-tu-red-50 px-3 py-2 text-xs font-medium text-tu-red-600">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="btn-ghost disabled:cursor-not-allowed disabled:opacity-60"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-tu-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tu-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "กำลังลบ…" : "ลบ"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

/** การ์ดสรุป 1 วิชา */
function CourseCard({
  course,
  onDeleteClick,
}: {
  course: CourseSummary;
  onDeleteClick: () => void;
}) {
  return (
    <Link
      href={`/course/${course.course_id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 transition-colors hover:bg-paper-50 -mx-4 px-4 sm:-mx-6 sm:px-6"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h2 className="truncate text-lg font-semibold text-ink-900 group-hover:text-tu-red-600 transition-colors">
            {course.subject}
          </h2>
          <span className="rounded bg-paper-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
            รายวิชา
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 sm:gap-10">
        <div className="flex items-center gap-6">
          <Stat value={course.week_count} label="สัปดาห์" />
          <Stat value={course.topic_count} label="หัวข้อ" />
          <Stat value={course.quiz_count} label="แบบทดสอบ" />
        </div>
        <button
          type="button"
          title="ลบวิชา"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDeleteClick();
          }}
          className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-line bg-white text-ink-400 transition hover:border-tu-red-200 hover:bg-tu-red-50/50 hover:text-tu-red-600"
        >
          <Trash2 className="h-[15px] w-[15px]" />
        </button>
        <span className="hidden sm:block text-ink-300 transition-colors group-hover:text-tu-red-500">
          <ChevronRight className="h-5 w-5" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col sm:items-center">
      <span className="text-xl font-semibold text-ink-900">{value}</span>
      <span className="mt-0.5 text-[13px] text-ink-500">{label}</span>
    </div>
  );
}
