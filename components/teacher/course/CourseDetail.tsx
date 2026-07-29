"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCourse, topicsFromSyllabusSchedule } from "@/lib/courseStore";
import { weekNumber, resolveHex, tagStyles } from "@/lib/weeks";
import { extractSyllabus } from "@/lib/syllabus";
import { buildPlanPayload } from "@/lib/planPayload";
import { fetchCourse, syncCourse } from "@/lib/coursesApi";
import { fetchCourseQuizzes } from "@/lib/quizzesApi";
import PageHeader from "@/components/ui/PageHeader";
import Modal, { ModalHeader } from "@/components/ui/Modal";
import EditCloModal, { type EditingClo } from "./EditCloModal";
import EditWeekTopicsModal, {
  type WeekTopicEdit,
} from "./EditWeekTopicsModal";
import {
  ChevronDown,
  Pencil,
  Trash2,
  FileText,
  ClipboardList,
  Plus,
  Check,
  CheckCircle2,
} from "lucide-react";
import type { Topic } from "@/lib/types";
import type { Quiz } from "@/lib/quiz";

interface WeekRow {
  week: string;
  topics: Topic[];
  quizzes: Quiz[];
}

/**
 * หน้ารายละเอียดของ 1 วิชา — สัปดาห์ที่จัดหัวข้อแล้ว + สถานะแบบทดสอบ
 * ตั้งวิชานี้เป็น "active" เพื่อให้หน้าจัดหัวข้อ/สร้างควิซทำงานกับวิชาที่ถูกต้อง
 */
export default function CourseDetail({ courseId }: { courseId: string }) {
  const {
    courses,
    getCourse,
    setActiveCourse,
    activeCourseId,
    setSyllabus,
    setSyllabusExtraction,
    setTopics,
    setWeekConfig,
    toggleQuizActive,
    deleteQuiz,
    updateClo,
    deleteClo,
    importCourse,
    importQuizzes,
    hydrated,
  } = useCourse();

  const course = getCourse(courseId);
  const slideFiles = useMemo(() => {
    if (!course) return [];
    const files = course.topics
      .map((t) => t.file)
      .filter(Boolean)
      .filter((f) => f !== course.syllabusName);
    return Array.from(new Set(files));
  }, [course]);
  const syllabusRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  // ยังไม่พบวิชานี้ในเครื่อง — กำลังลองโหลดจาก backend (เช่น session/เครื่องอื่นเคยสร้างไว้)
  const [remoteLoading, setRemoteLoading] = useState(false);
  // สัปดาห์ที่กางรายการควิซอยู่ (accordion) — กางได้หลายสัปดาห์พร้อมกัน
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  // CLO ที่กำลังแก้ไข (null = ปิด modal)
  const [editingClo, setEditingClo] = useState<EditingClo | null>(null);
  // สัปดาห์ที่กำลังแก้หัวข้อ (null = ปิด modal)
  const [editingWeek, setEditingWeek] = useState<string | null>(null);

  function toggleWeek(week: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  }

  // เปลี่ยน "ชุดที่ใช้งาน" ต้องกดยืนยันก่อน — เก็บตัวเลือกที่ค้าง (ยังไม่บันทึก) ต่อสัปดาห์
  const [pendingActive, setPendingActive] = useState<Record<string, string>>({});
  // ป็อปอัปลบ/เตือน — เก็บควิซที่กำลังจะลบ
  const [deleteTarget, setDeleteTarget] = useState<{
    week: string;
    quiz: Quiz;
  } | null>(null);

  /** เลือกชุด (ยังไม่บันทึก) — ถ้าเลือกกลับเป็นชุดเดิมที่ใช้อยู่ ถือว่าไม่มีการเปลี่ยน */
  function pickActive(week: string, quizId: string, committedId?: string) {
    setPendingActive((prev) => {
      const next = { ...prev };
      const currentSelected = prev[week] !== undefined ? prev[week] : committedId;
      const nextId = currentSelected === quizId ? "none" : quizId;
      if (nextId === committedId || (nextId === "none" && !committedId)) {
        delete next[week];
      } else {
        next[week] = nextId;
      }
      return next;
    });
  }
  /** บันทึกการเปลี่ยนชุดที่ใช้งานของสัปดาห์นั้น */
  function saveActive(week: string) {
    const pid = pendingActive[week];
    if (pid) toggleQuizActive(week, pid);
    setPendingActive((prev) => {
      const next = { ...prev };
      delete next[week];
      return next;
    });
  }
  /** ยกเลิกการเปลี่ยน — กลับไปใช้ชุดที่บันทึกไว้ */
  function cancelActive(week: string) {
    setPendingActive((prev) => {
      const next = { ...prev };
      delete next[week];
      return next;
    });
  }

  // ตั้งวิชานี้เป็น active เมื่อเข้าหน้า (ให้ /topics, /quiz ทำงานกับวิชานี้)
  useEffect(() => {
    if (course && activeCourseId !== courseId) setActiveCourse(courseId);
  }, [course, courseId, activeCourseId, setActiveCourse]);

  // ยังไม่มีวิชานี้ในเครื่อง (เช่นมาจากลิงก์ในหน้ารายวิชาทั้งหมด แต่เครื่องนี้ยังไม่เคย
  // เปิด/สร้างวิชานี้มาก่อน) — ลองโหลดจาก backend (GET /api/v1/courses/{id}) แล้วเติมเข้า
  // local store ให้ ก่อนจะฟันธงว่า "ไม่พบรายวิชานี้"
  useEffect(() => {
    if (!hydrated || course) return;
    setRemoteLoading(true);
    fetchCourse(courseId)
      .then(async (remote) => {
        importCourse(remote);
        // ดึงควิซที่บันทึกไว้แล้วของวิชานี้มาเติมด้วย — ไม่ critical ถ้าไม่มี/ดึงไม่สำเร็จ
        try {
          const remoteQuizzes = await fetchCourseQuizzes(courseId);
          importQuizzes(courseId, remoteQuizzes);
        } catch {
          // ไม่มีควิซที่ backend หรือดึงไม่สำเร็จ — ปล่อยว่างไว้ก่อนได้
        }
      })
      .catch(() => {
        // ไม่มีวิชานี้ที่ backend ด้วย — ปล่อยให้ !course branch ด้านล่างแสดง "ไม่พบรายวิชานี้"
      })
      .finally(() => setRemoteLoading(false));
  }, [hydrated, course, courseId, importCourse, importQuizzes]);

  function onPickSyllabus(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !course) return;

    const reader = new FileReader();
    reader.onload = () => setSyllabus(file.name, reader.result as string);
    reader.readAsDataURL(file);

    setExtractError("");
    setExtracting(true);
    extractSyllabus(file)
      .then((extraction) => {
        setSyllabusExtraction(extraction);
        // เปลี่ยนไฟล์ syllabus ใหม่ = จัดหัวข้อใหม่ทั้งชุดตามตารางสอนที่แกะได้
        // (ของเดิมถูกทิ้ง — ถ้าแกะไม่ได้อะไรเลยก็คงหัวข้อเดิมไว้ ไม่ล้างทิ้งเปล่าๆ)
        const newTopics = topicsFromSyllabusSchedule(extraction, file.name);
        if (newTopics.length > 0) setTopics(newTopics);

        // sync CLO/หัวข้อชุดใหม่เข้า backend ทันที (PUT — best-effort ถ้าพลาดยังแก้ไข
        // ต่อในเครื่องได้ แล้วจะ sync ใหม่ตอนกด "ยืนยันและส่งข้อมูล" ในหน้าจัดหัวข้อ)
        const topicsForSync = newTopics.length > 0 ? newTopics : course.topics;
        syncCourse(
          courseId,
          buildPlanPayload(
            extraction.course_code,
            course.subject,
            extraction.clos,
            topicsForSync,
          ),
        ).catch((err) =>
          console.error("sync วิชาไปที่ backend ไม่สำเร็จ", err),
        );
      })
      .catch(() =>
        setExtractError("แยกข้อมูลจาก syllabus ไม่สำเร็จ ลองแนบไฟล์ใหม่อีกครั้ง"),
      )
      .finally(() => setExtracting(false));
  }

  const rows = useMemo<WeekRow[]>(() => {
    if (!course) return [];
    const map = new Map<string, Topic[]>();
    for (const t of course.topics) {
      if (!t.weekAssigned) continue;
      const list = map.get(t.weekAssigned) ?? [];
      list.push(t);
      map.set(t.weekAssigned, list);
    }
    return Array.from(map.entries())
      .map(([week, list]) => ({
        week,
        topics: list,
        quizzes: course.quizzes[week] ?? [],
      }))
      .sort((a, b) => Number(weekNumber(a.week)) - Number(weekNumber(b.week)));
  }, [course]);

  if (!hydrated || (!course && remoteLoading)) {
    return (
      <div className="grid place-items-center py-24 text-sm text-ink-400">
        กำลังโหลด…
      </div>
    );
  }

  // เผื่อ id ไม่ตรงกับวิชาใด ทั้งในเครื่องนี้และที่ backend (เช่นถูกลบไปแล้ว)
  if (!course) {
    return (
      <div className="card-empty">
        <h2 className="display text-lg">ไม่พบรายวิชานี้</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
          รายวิชาอาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง
        </p>
        <Link href="/course" className="btn-primary mt-5">
          ← กลับไปหน้ารายวิชา
        </Link>
      </div>
    );
  }

  const unassigned = course.topics.filter((t) => !t.weekAssigned).length;

  function handleDelete(week: string, quiz: Quiz) {
    setDeleteTarget({ week, quiz });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteQuiz(deleteTarget.week, deleteTarget.quiz.id);
    // ถ้าตัวที่ลบเป็นตัวที่ค้างเลือกไว้ ให้เคลียร์ค่าที่ค้างของสัปดาห์นั้น
    setPendingActive((prev) => {
      if (prev[deleteTarget.week] !== deleteTarget.quiz.id) return prev;
      const next = { ...prev };
      delete next[deleteTarget.week];
      return next;
    });
    setDeleteTarget(null);
  }

  return (
    <div>
      {/* breadcrumb กลับไปหน้ารายวิชาทั้งหมด */}
      <Link
        href="/course"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 transition hover:text-tu-red-600"
      >
        ← รายวิชาทั้งหมด
        {courses.length > 1 && (
          <span className="text-ink-400"> ({courses.length} วิชา)</span>
        )}
      </Link>

      <PageHeader
        eyebrow={course.subject}
        title={course.courseCode ?? course.subject}
        action={
          <>
            <Link href="/upload" className="btn-secondary">
              + อัปโหลดสไลด์
            </Link>
            <Link href="/topics" className="btn-primary">
              จัดหัวข้อรายสัปดาห์
            </Link>
          </>
        }
      />

      {/* แถบไฟล์ syllabus */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-tu-red-50 text-tu-red-600">
            <FileText className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Course Syllabus
              {course.courseCode && (
                <span className="ml-1.5 normal-case text-ink-500">
                  · {course.courseCode}
                </span>
              )}
            </p>
            <p className="truncate text-sm font-medium text-ink-700">
              {course.syllabusName ?? "ยังไม่ได้แนบไฟล์"}
            </p>
            {extracting && (
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-400">
                <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-line-strong border-t-tu-red-500" />
                กำลังแยก CLO และตารางสอน…
              </p>
            )}
            {extractError && (
              <p className="mt-0.5 text-[11px] text-tu-red-600">
                {extractError}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 text-xs">
          {course.syllabusData && (
            <a
              href={course.syllabusData}
              download={course.syllabusName ?? "course-syllabus.pdf"}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              ดาวน์โหลด
            </a>
          )}
          <button
            type="button"
            onClick={() => syllabusRef.current?.click()}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            {course.syllabusData ? "เปลี่ยนไฟล์" : "แนบไฟล์"}
          </button>
          <input
            ref={syllabusRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={onPickSyllabus}
          />
        </div>
      </div>

      {/* แถบไฟล์สไลด์การสอนทั้งหมด */}
      {slideFiles.length > 0 && (
        <div className="mb-6 rounded-xl border border-line bg-paper-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md bg-amber-50 text-amber-600">
              <FileText className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                สไลด์การสอนทั้งหมด ({slideFiles.length} ไฟล์)
              </p>
              <p className="text-xs text-ink-500">
                ไฟล์ที่อัปโหลดเข้าสู่ระบบเพื่อให้นำไปจัดและวิเคราะห์เป็นจุดอ่อนจุดแข็งของนักศึกษา
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1">
            {slideFiles.map((file) => (
              <div
                key={file}
                className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-700 shadow-2xs transition hover:border-line-strong hover:bg-paper-50"
              >
                <FileText className="h-3.5 w-3.5 text-tu-red-500" />
                <span className="truncate max-w-[220px]" title={file}>
                  {file}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ผลลัพธ์การเรียนรู้ (CLO) ที่แกะได้จาก syllabus */}
      {course.clos.length > 0 && (
        <div className="mb-6 card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line-soft px-4 py-3 sm:px-5">
            <h2 className="text-sm font-bold text-ink-800">
              ผลลัพธ์การเรียนรู้ (CLO)
            </h2>
            <span className="text-[11px] text-ink-400">
              {course.clos.length} ข้อ
            </span>
          </div>
          <ul className="divide-y divide-line-soft">
            {course.clos.map((clo, index) => (
              <li
                key={index}
                className="group flex items-start gap-3 px-4 py-3 sm:px-5"
              >
                <span className="h-fit flex-shrink-0 rounded-full bg-tu-gold-50 px-2 py-0.5 text-[10px] font-bold text-tu-gold-700 ring-1 ring-tu-gold-200">
                  {clo.code}
                </span>
                <p className="flex-1 text-xs leading-relaxed text-ink-600">
                  {clo.description ?? (
                    <span className="italic text-ink-400">
                      ไม่มีคำอธิบายในเอกสาร
                    </span>
                  )}
                </p>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingClo({
                        index,
                        code: clo.code,
                        description: clo.description,
                      })
                    }
                    title="แก้ไข CLO"
                    className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-ink-400 transition hover:border-line-strong hover:text-tu-red-600"
                  >
                    <Pencil className="h-[13px] w-[13px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteClo(index)}
                    title="ลบ CLO"
                    className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-ink-400 transition hover:border-tu-red-200 hover:bg-tu-red-50/50 hover:text-tu-red-600"
                  >
                    <Trash2 className="h-[13px] w-[13px]" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* รายการสัปดาห์ */}
      {rows.length === 0 ? (
        <div className="card-empty">
          <h2 className="display text-lg">ยังไม่ได้จัดหัวข้อเข้าสัปดาห์</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            {unassigned > 0
              ? `มี ${unassigned} หัวข้อรอจัดเข้าสัปดาห์ ไปที่หน้า “จัดหัวข้อ” เพื่อเลือกหัวข้อเข้าสัปดาห์ก่อน`
              : "อัปโหลดสไลด์เพื่อให้ระบบช่วยแยกหัวข้อ แล้วจึงจัดเข้าสัปดาห์"}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/upload" className="btn-secondary">
              + อัปโหลดสไลด์
            </Link>
            <Link href="/topics" className="btn-primary">
              ไปจัดหัวข้อ
            </Link>
          </div>
        </div>
      ) : (
        <div className="border-t border-line-soft">
          {rows.map((row) => {
            const wk = weekNumber(row.week);
            const open = expandedWeeks.has(row.week);
            const hasQuizzes = row.quizzes.length > 0;

            // สีประจำสัปดาห์ที่อาจารย์เลือกไว้ (จาก weekConfig) — ไล่ไปทั้งเลข/ปุ่ม/ป้าย
            const colorKey = course.weekConfig?.[row.week]?.colorKey;
            const hex = resolveHex(colorKey);
            const soft = tagStyles(colorKey).soft;
            // ชุดที่ใช้งานจริง (บันทึกแล้ว) vs ชุดที่เพิ่งเลือก (ยังไม่บันทึก)
            const committedActiveId = row.quizzes.find((q) => q.isActive)?.id;
            const selectedId = pendingActive[row.week] ?? committedActiveId;
            const hasPending =
              pendingActive[row.week] != null &&
              pendingActive[row.week] !== committedActiveId;
            const activeQuiz = row.quizzes.find((q) => q.isActive);

            // เลขสัปดาห์ตัวใหญ่ (สีตามสัปดาห์) + คำว่า WEEK
            const WeekNum = (
              <div className="flex-shrink-0">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-300">
                  Week
                </span>
                <span
                  className="block text-[42px] font-bold leading-[0.8] tabular-nums"
                  style={{ color: hex, opacity: hasQuizzes ? 1 : 0.5 }}
                >
                  {wk.padStart(2, "0")}
                </span>
              </div>
            );

            // หัวข้อของสัปดาห์ + แถวสถานะ (chip)
            const WeekInfo = (
              <div className="min-w-0 flex-1">
                <p className="max-w-[54ch] text-[15px] font-bold leading-snug text-ink-900 transition-colors group-hover/hdr:text-tu-red-700">
                  {row.topics.map((t) => t.title).join("  ·  ")}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-paper-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
                    <ClipboardList className="h-3 w-3" />
                    {hasQuizzes
                      ? `${row.quizzes.length} แบบทดสอบ`
                      : "ยังไม่มีแบบทดสอบ"}
                  </span>
                  {hasQuizzes &&
                    (activeQuiz ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#047857] ring-1 ring-emerald-200/70">
                        <CheckCircle2 className="h-3 w-3" />
                        พร้อมสอบ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tu-gold-50 px-2 py-0.5 text-[10px] font-bold text-tu-gold-700 ring-1 ring-tu-gold-200/70">
                        ยังไม่ได้เลือกชุด
                      </span>
                    ))}
                </div>
              </div>
            );

            // ลิงก์สร้างควิซ — ขีดเส้นใต้ขยายตอน hover + เครื่องหมาย + หมุนเล็กน้อย
            const createLink = (label: string) => (
              <Link
                href={`/quiz/${wk}?new=1`}
                className="group/create inline-flex flex-shrink-0 items-center gap-1 text-[13px] font-semibold text-tu-red-600 transition-colors hover:text-tu-red-700"
              >
                <span className="inline-block transition-transform duration-200 group-hover/create:rotate-90 group-hover/create:scale-110">
                  +
                </span>
                <span className="underline decoration-1 underline-offset-4 transition-all duration-200 group-hover/create:underline-offset-[6px]">
                  {label}
                </span>
              </Link>
            );

            return (
              <div key={row.week} className="border-b border-line-soft">
                <div className="flex items-center gap-2">
                  {hasQuizzes ? (
                    /* สัปดาห์ที่มีควิซ — กดหัวเพื่อกาง/พับรายการควิซ */
                    <button
                      type="button"
                      onClick={() => toggleWeek(row.week)}
                      aria-expanded={open}
                      className="group/hdr -mx-2 flex flex-1 items-center gap-5 rounded-2xl px-2 py-5 text-left transition-colors hover:bg-paper-100/50"
                    >
                      {WeekNum}
                      {WeekInfo}
                      <span
                        aria-hidden
                        className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                          open
                            ? "border-transparent"
                            : "border-line text-ink-400 group-hover/hdr:border-line-strong group-hover/hdr:text-ink-600"
                        }`}
                        style={
                          open
                            ? { backgroundColor: soft.backgroundColor, color: soft.color }
                            : undefined
                        }
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                        />
                      </span>
                    </button>
                  ) : (
                    /* สัปดาห์ที่ยังไม่มีควิซ — ปุ่มสร้างควิซแทน */
                    <div className="-mx-2 flex flex-1 items-center gap-5 rounded-2xl px-2 py-5">
                      {WeekNum}
                      {WeekInfo}
                      {createLink("สร้างควิซ")}
                    </div>
                  )}
                  {/* แก้หัวข้อของสัปดาห์นี้ (เปลี่ยนชื่อ/เอาออก) */}
                  <button
                    type="button"
                    onClick={() => setEditingWeek(row.week)}
                    title="แก้ไขหัวข้อของสัปดาห์นี้"
                    className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-line bg-white text-ink-400 transition hover:border-line-strong hover:text-tu-red-600 active:scale-95"
                  >
                    <Pencil className="h-[14px] w-[14px]" />
                  </button>
                </div>

                {/* รายการควิซที่กางออกมา — เยื้องให้ตรงกับหัวข้อ */}
                {open && hasQuizzes && (
                  <div className="ml-0 animate-slide-up pb-7 sm:ml-[76px]">
                    <div className="space-y-3">
                      {row.quizzes.map((q, i) => {
                        const active = q.id === selectedId;
                        const isCommitted = q.isActive;
                        return (
                          <div
                            key={q.id}
                            className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 transition-all duration-200 shadow-2xs"
                            style={{
                              backgroundColor: active ? `${hex}0c` : "#fafafa",
                            }}
                          >
                            {/* ซ้าย: ข้อมูลควิซ */}
                            <div className="min-w-0 flex-1">
                              <span
                                className="block truncate text-sm font-bold transition-colors"
                                style={{ color: active ? hex : "#111827" }}
                              >
                                {q.title}
                              </span>
                              <span className="mt-1 block text-xs font-semibold text-ink-400">
                                {q.questions.length} ข้อ
                              </span>
                            </div>

                            {/* ขวา: Badge และปุ่มจัดการ + Toggle Switch */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                              {/* Badges */}
                              {isCommitted && (
                                <span
                                  className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-3xs"
                                  style={{
                                    color: hex,
                                    backgroundColor: `${hex}14`,
                                  }}
                                >
                                  เลือกอยู่
                                </span>
                              )}

                              {active && !isCommitted && (
                                <span className="rounded-lg bg-tu-gold-50 px-2.5 py-1 text-[10px] font-bold text-tu-gold-700 ring-1 ring-tu-gold-200/50">
                                  ยังไม่บันทึกเปิด
                                </span>
                              )}
                              {!active && isCommitted && (
                                <span className="rounded-lg bg-tu-red-50 px-2.5 py-1 text-[10px] font-bold text-tu-red-700 ring-1 ring-tu-red-200/50">
                                  ยังไม่บันทึกปิด
                                </span>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/quiz/${wk}?quiz=${q.id}`}
                                  title="แก้ไขควิซ"
                                  className="grid h-8 w-8 place-items-center rounded-xl border border-gray-200 bg-white text-ink-400 transition hover:border-line-strong hover:text-tu-red-600 hover:shadow-2xs active:scale-90"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(row.week, q)}
                                  title="ลบ"
                                  className="grid h-8 w-8 place-items-center rounded-xl border border-gray-200 bg-white text-ink-300 transition hover:border-line-strong hover:text-tu-red-600 hover:shadow-2xs active:scale-90"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {/* Toggle Switch (ขวาสุด) */}
                              <button
                                type="button"
                                onClick={() =>
                                  pickActive(row.week, q.id, committedActiveId)
                                }
                                title={active ? "ปิดแบบทดสอบนี้" : "เปิดแบบทดสอบนี้"}
                                aria-pressed={active}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/15 ${
                                  active ? "bg-emerald-500" : "bg-gray-300"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                    active ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* สร้างควิซเพิ่ม */}
                      <div className="mt-3.5 pl-1 flex justify-start">
                        <Link
                          href={`/quiz/${wk}?new=1`}
                          className="group/create inline-flex items-center gap-1.5 text-xs font-bold transition-colors"
                          style={{ color: hex }}
                        >
                          <span className="inline-block text-sm font-semibold transition-transform duration-200 group-hover/create:rotate-90 group-hover/create:scale-110">
                            +
                          </span>
                          <span className="hover:underline">สร้างควิซเพิ่ม</span>
                        </Link>
                      </div>
                    </div>

                    {/* แถบยืนยันเมื่อมีการเปลี่ยนชุดที่ใช้งาน (ยังไม่บันทึก) */}
                    {hasPending && (
                      <div className="mt-4 flex animate-slide-up flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-tu-gold-200 bg-tu-gold-50/50 p-3 pl-4 pr-3.5">
                        <span className="flex items-center gap-2 text-xs font-semibold text-tu-gold-800">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tu-gold-400 opacity-70" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-tu-gold-500" />
                          </span>
                          มีข้อสอบที่มีการเปลี่ยนแปลงการเปิด/ปิดสอบ — ยังไม่บันทึก
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => cancelActive(row.week)}
                            className="rounded-xl px-3.5 py-2 text-xs font-bold text-ink-500 transition hover:bg-paper-200 active:scale-95"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            onClick={() => saveActive(row.week)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-tu-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-tu-red-700 active:scale-95"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            บันทึกการเปลี่ยนแปลง
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ป็อปอัปลบ / เตือนเมื่อพยายามลบชุดที่ใช้งานอยู่ */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        {deleteTarget &&
          (deleteTarget.quiz.isActive ? (
            <>
              <ModalHeader title="ลบชุดนี้ไม่ได้" />
              <p className="text-sm leading-relaxed text-ink-600">
                “{deleteTarget.quiz.title}” เป็น
                <span className="font-semibold text-ink-800">
                  ชุดที่ใช้งานอยู่
                </span>{" "}
                ของ{deleteTarget.week} — กรุณาเปลี่ยนไปใช้ชุดอื่น
                (แล้วกดบันทึกการเปลี่ยนแปลง) ก่อน จึงจะลบชุดนี้ได้
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="btn-primary px-5"
                >
                  เข้าใจแล้ว
                </button>
              </div>
            </>
          ) : (
            <>
              <ModalHeader title="ยืนยันการลบ" />
              <p className="text-sm leading-relaxed text-ink-600">
                ต้องการลบ “{deleteTarget.quiz.title}” ออกจาก{deleteTarget.week}{" "}
                ใช่ไหม? การลบนี้ย้อนกลับไม่ได้
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="btn-ghost"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-lg bg-tu-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tu-red-600"
                >
                  ลบ
                </button>
              </div>
            </>
          ))}
      </Modal>

      {/* แก้ไข CLO (รหัส/คำอธิบาย) หรือลบทั้งข้อ */}
      <EditCloModal
        editing={editingClo}
        onClose={() => setEditingClo(null)}
        onSave={updateClo}
      />

      {/* แก้หัวข้อของสัปดาห์ (เปลี่ยนชื่อ / เอาออกจากสัปดาห์) */}
      <EditWeekTopicsModal
        week={editingWeek}
        topics={course.topics.filter((t) => t.weekAssigned === editingWeek)}
        colorKey={
          editingWeek ? course.weekConfig?.[editingWeek]?.colorKey : undefined
        }
        onClose={() => setEditingWeek(null)}
        onApply={(edits: WeekTopicEdit[], colorKey: string) => {
          setTopics((prev) =>
            prev.map((t) => {
              const e = edits.find((x) => x.id === t.id);
              if (!e) return t;
              if (e.remove) return { ...t, weekAssigned: null };
              return { ...t, title: e.title || t.title };
            }),
          );
          if (editingWeek) {
            setWeekConfig((prev) => ({
              ...prev,
              [editingWeek]: { ...prev[editingWeek], colorKey },
            }));
          }
        }}
      />
    </div>
  );
}
