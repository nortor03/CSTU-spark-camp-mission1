"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCourse } from "@/lib/courseStore";
import { deleteCourse, fetchCourses, type CourseSummary } from "@/lib/coursesApi";
import PageHeader from "@/components/ui/PageHeader";
import Modal, { ModalHeader } from "@/components/ui/Modal";
import { ChevronRight, Trash2, Calendar, Users, CheckSquare } from "lucide-react";

/**
 * หน้าภาพรวมรายวิชา — สรุป "ทุกวิชา" ที่อาจารย์คนนี้สอน
 * ดึงจาก backend รายวิชา (GET /api/v1/courses) โดยตรง
 * กดการ์ดวิชาเพื่อเข้าไปดูรายละเอียดของวิชานั้น
 */
export default function CourseList() {
  const { courses: localCourses, hydrated } = useCourse();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">(
    "loading",
  );
  const [deleteTarget, setDeleteTarget] = useState<CourseSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setStatus("loading");
    fetchCourses()
      .then((items) => {
        if (cancelled) return;
        if (items.length === 0 && localCourses.length > 0) {
          const mapped: CourseSummary[] = localCourses.map((c) => ({
            course_id: c.id,
            course_code: c.courseCode || "วิชา",
            subject: c.subject,
            week_count: c.totalWeeks,
            topic_count: c.topics.length,
            quiz_count: Object.values(c.quizzes).flat().length,
          }));
          setCourses(mapped);
        } else {
          setCourses(items);
        }
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("ไม่สามารถดึงข้อมูลจาก Backend ได้ จะแสดงข้อมูลในเครื่องแทน", err);
        const mapped: CourseSummary[] = localCourses.map((c) => ({
          course_id: c.id,
          course_code: c.courseCode || "วิชา",
          subject: c.subject,
          week_count: c.totalWeeks,
          topic_count: c.topics.length,
          quiz_count: Object.values(c.quizzes).flat().length,
        }));
        setCourses(mapped);
        setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, localCourses]);

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
        eyebrow="ยินดีต้อนรับผู้สอน"
        title="รายวิชาที่ดูแลทั้งหมด"
        subtitle="แดชบอร์ดสรุปวิชาสอน จัดการสไลด์ วิเคราะห์ CLO และจัดทำแบบทดสอบประจำบทเรียน"
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
        <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[1100px]">
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
  const code = course.course_code || "วิชา";
  // *** ยังเป็นข้อมูล mock อยู่ — backend ยังไม่มี endpoint ให้ดึงจำนวนนักศึกษาจริง ***
  // เช็คจาก /openapi.json ของ backend แล้ว (ยืนยัน ณ ตอนที่เขียนคอมเมนต์นี้) ไม่มี concept
  // "ลงทะเบียนเรียน"/รายชื่อนักศึกษาต่อวิชาเลย ต่างจาก quiz_count ที่มี endpoint จริงแต่
  // backend คำนวณผิด (ดูคอมเมนต์ quiz_count ใน lib/coursesApi.ts) — อันนี้ backend ต้อง
  // สร้าง endpoint ใหม่ก่อนถึงจะดึงค่าจริงมาแทนได้ (เช่น GET /api/v1/courses/{id}/students)
  const studentCount = code.includes("CN101") ? 142 : code.includes("CS232") ? 88 : code.includes("GE145") ? 64 : 95;

  return (
    <div className="group relative flex w-full max-w-[360px] flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-sm">
      <div className="space-y-4">
        {/* แถวบนสุด: รหัสวิชา */}
        <div className="text-xs">
          <span className="font-bold text-ink-400 uppercase tracking-wider">{code}</span>
        </div>

        {/* ชื่อวิชา */}
        <h3 className="text-base font-bold text-ink-900 leading-snug group-hover:text-tu-red-700 transition-colors">
          {course.subject}
        </h3>

        {/* สถิติ 2 คอลัมน์ (จัดให้เห็นคำครบถ้วน) */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="flex items-center gap-1.5 rounded-xl bg-paper-50 p-2">
            <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded bg-tu-red-50 text-tu-red-600">
              <Users className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold text-ink-400 uppercase tracking-tight">นักศึกษาในระบบ</p>
              <p className="text-xs font-bold text-ink-800 whitespace-nowrap">{studentCount} คน</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-paper-50 p-2">
            <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded bg-amber-50 text-amber-600">
              <CheckSquare className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold text-ink-400 uppercase tracking-tight">ชุดแบบทดสอบ</p>
              <p className="text-xs font-bold text-ink-800 whitespace-nowrap">{course.quiz_count} ชุด</p>
            </div>
          </div>
        </div>
      </div>

      {/* ปุ่มกดจัดการ + ปุ่มลบวิชา */}
      <div className="mt-5 flex items-center gap-2">
        <Link
          href={`/course/${course.course_id}`}
          className="flex-1 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-tu-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-tu-red-700 active:scale-95"
        >
          <span>เข้าจัดการวิชา</span>
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDeleteClick();
          }}
          title="ลบรายวิชา"
          className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white text-ink-400 transition hover:border-tu-red-200 hover:bg-tu-red-50 hover:text-tu-red-600 active:scale-95"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
