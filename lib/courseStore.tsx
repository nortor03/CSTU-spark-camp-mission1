"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { Topic, WeekConfigMap } from "./types";
import type { Quiz } from "./quiz";
import type { Submission } from "./analytics";
import type {
  SyllabusAssessmentActivity,
  SyllabusClo,
  SyllabusExtraction,
  SyllabusWeekItem,
} from "./syllabus";
import { MOCK_AI_TOPICS } from "./mockTopics";
import { DEFAULT_WEEK_COUNT } from "./weeks";

/**
 * สถานะกลางของแอป — รองรับ "หลายรายวิชา" ต่ออาจารย์หนึ่งคน
 * (แทน backend จริง เก็บลง localStorage)
 *
 * แนวคิด:
 * - courses[]        = ทุกวิชาที่อาจารย์สร้างไว้
 * - activeCourseId   = วิชาที่กำลังทำงานอยู่ (ตั้งเมื่อกดเข้าไปในวิชานั้น)
 * - accessor เดิม (subject/topics/quizzes/…) ทำงานกับ "วิชาที่ active"
 *   เพื่อให้หน้าเดิม (จัดหัวข้อ/สร้างควิซ/ทำแบบทดสอบ) ใช้ต่อได้โดยไม่ต้องแก้มาก
 */
export interface Course {
  id: string;
  subject: string;
  syllabusName: string | null;
  /** เนื้อไฟล์ course syllabus เป็น data URL (ใช้ดาวน์โหลด) */
  syllabusData: string | null;
  /** รหัสวิชา ที่แกะได้จาก syllabus (เช่น "คพ.232") */
  courseCode: string | null;
  /** true = syllabus มีตารางสอนรายสัปดาห์ให้แกะ */
  hasWeeklySchedule: boolean;
  /** ผลลัพธ์การเรียนรู้ (CLO) ที่แกะได้จาก syllabus */
  clos: SyllabusClo[];
  /** เกณฑ์การประเมินผลที่แกะได้จาก syllabus */
  assessmentActivities: SyllabusAssessmentActivity[];
  /** ตารางสอนรายสัปดาห์ที่แกะได้จาก syllabus */
  weeklyScheduleItems: SyllabusWeekItem[];
  /** จำนวนสัปดาห์ทั้งหมดของวิชา (ตัวเลือก "สัปดาห์ที่ N" ในฟอร์มต่างๆ ขึ้นกับค่านี้) */
  totalWeeks: number;
  topics: Topic[];
  weekConfig: WeekConfigMap;
  /** ควิซราย "สัปดาห์" (key = ป้ายสัปดาห์ เช่น "สัปดาห์ที่ 3") */
  quizzes: Record<string, Quiz[]>;
  /** คำตอบที่นักเรียนส่งแล้ว (สำหรับรายงานภาพรวม) */
  submissions: Submission[];
  createdAt: string;
}

interface CourseContextValue {
  /* ---- ระดับหลายวิชา ---- */
  courses: Course[];
  activeCourseId: string | null;
  activeCourse: Course | null;
  setActiveCourse: (id: string | null) => void;
  /** สร้างวิชาใหม่ (คืนค่า id แล้วตั้งเป็น active) */
  addCourse: (
    subject: string,
    syllabusName: string | null,
    syllabusData: string | null,
    initialTopics?: Topic[],
    syllabusExtraction?: SyllabusExtraction | null,
  ) => string;
  getCourse: (id: string) => Course | undefined;

  /* ---- accessor ของ "วิชาที่ active" (คงชื่อเดิมเพื่อความเข้ากันได้) ---- */
  subject: string;
  syllabusName: string | null;
  syllabusData: string | null;
  setSyllabus: (name: string | null, data: string | null) => void;
  courseCode: string | null;
  hasWeeklySchedule: boolean;
  clos: SyllabusClo[];
  assessmentActivities: SyllabusAssessmentActivity[];
  weeklyScheduleItems: SyllabusWeekItem[];
  /** บันทึกผลแยก syllabus (CLO/ตารางสอน/เกณฑ์ประเมิน) เข้าวิชาที่ active */
  setSyllabusExtraction: (extraction: SyllabusExtraction) => void;
  /** เพิ่ม CLO ใหม่ด้วยมือ (เผื่อ syllabus แกะไม่ครบ หรือวิชาไม่มี syllabus) */
  addClo: (code: string, description: string | null) => void;
  totalWeeks: number;
  /** เพิ่มจำนวนสัปดาห์ทั้งหมดของวิชาอีก 1 สัปดาห์ */
  addWeek: () => void;
  /** ลดจำนวนสัปดาห์ทั้งหมดลง 1 สัปดาห์ (ทำไม่ได้ถ้าสัปดาห์สุดท้ายยังมีหัวข้ออยู่ หรือเหลือแค่ 1 สัปดาห์) */
  removeWeek: () => void;
  topics: Topic[];
  setTopics: Dispatch<SetStateAction<Topic[]>>;
  weekConfig: WeekConfigMap;
  setWeekConfig: Dispatch<SetStateAction<WeekConfigMap>>;
  quizzes: Record<string, Quiz[]>;
  saveQuiz: (week: string, quiz: Quiz) => void;
  getQuiz: (week: string) => Quiz | undefined;
  toggleQuizActive: (week: string, quizId: string) => void;
  /** ลบควิซ 1 ชุดออกจากสัปดาห์ — ถ้าลบตัวที่ active และยังมีตัวอื่นเหลือ จะเลื่อนตัวแรกขึ้นเป็น active */
  deleteQuiz: (week: string, quizId: string) => void;
  /** เพิ่มหัวข้อชุดใหม่ (จากการอัปโหลดสไลด์เพิ่ม) เข้าวิชาที่ active */
  addTopics: (topics: Topic[]) => void;

  /* ---- ระดับผู้ใช้ (นักเรียน) ---- */
  studentId: string | null;
  setStudentId: (id: string | null) => void;
  submissions: Submission[];
  saveSubmission: (submission: Submission) => void;
  getSubmissions: (week: string) => Submission[];

  hydrated: boolean;
}

const CourseContext = createContext<CourseContextValue | null>(null);

const STORAGE_KEY = "tonlabkit:course";

let idCounter = 0;
function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

/** หัวข้อชุดใหม่ (ยังไม่จัดเข้าสัปดาห์) — จำลองผลวิเคราะห์จาก AI */
export function freshTopics(): Topic[] {
  return MOCK_AI_TOPICS.map((t) => ({
    ...t,
    // ให้ id ไม่ชนกันข้ามวิชา/ข้ามการอัปโหลด
    id: makeId("t"),
    selected: false,
    weekAssigned: null,
    aiGenerated: true,
  }));
}

/**
 * สร้างหัวข้อจากตารางสอนรายสัปดาห์ที่แกะได้จาก syllabus จริง
 * ต่างจาก freshTopics() ตรงที่ "จัดเข้าสัปดาห์ให้อัตโนมัติ" ตาม week_number
 * ที่ backend ส่งมา ไม่ต้องลากเข้าสัปดาห์เองอีก
 *
 * แถวที่ไม่มีชื่อหัวข้อ (topic: null) ถูกข้าม — ไม่มีอะไรให้แสดงเป็นการ์ด
 * แถวที่มีหัวข้อแต่ไม่ระบุสัปดาห์ (week_number: null) จะสร้างเป็นหัวข้อ
 * "ยังไม่จัดเข้าสัปดาห์" ให้ครูลากจัดเองภายหลัง แทนที่จะทิ้งไปเฉยๆ
 */
export function topicsFromSyllabusSchedule(
  extraction: SyllabusExtraction,
  syllabusName: string | null,
): Topic[] {
  return extraction.items
    .filter((item): item is typeof item & { topic: string } => !!item.topic)
    .map((item) => ({
      id: makeId("t"),
      title: item.topic,
      file: syllabusName ?? "Course Syllabus",
      selected: false,
      weekAssigned:
        item.week_number != null ? `สัปดาห์ที่ ${item.week_number}` : null,
      aiGenerated: true,
      relatedClos: item.related_clos,
    }));
}

function emptyCourse(
  subject: string,
  syllabusName: string | null,
  syllabusData: string | null,
  initialTopics?: Topic[],
  syllabusExtraction?: SyllabusExtraction | null,
): Course {
  return {
    id: makeId("course"),
    subject,
    syllabusName,
    syllabusData,
    courseCode: syllabusExtraction?.course_code ?? null,
    hasWeeklySchedule: syllabusExtraction?.has_weekly_schedule ?? false,
    clos: syllabusExtraction?.clos ?? [],
    assessmentActivities: syllabusExtraction?.assessment_activities ?? [],
    weeklyScheduleItems: syllabusExtraction?.items ?? [],
    totalWeeks: Math.max(
      DEFAULT_WEEK_COUNT,
      ...(syllabusExtraction?.items.map((i) => i.week_number ?? 0) ?? [0]),
    ),
    topics: initialTopics ?? freshTopics(),
    weekConfig: {},
    quizzes: {},
    submissions: [],
    createdAt: new Date().toISOString(),
  };
}

/** เติมฟิลด์ผล syllabus extraction ที่ยังไม่มี (ข้อมูลเก่าก่อนมีฟีเจอร์นี้) ให้ครบ */
function backfillCourse(c: Record<string, unknown>): Course {
  return {
    ...c,
    courseCode: typeof c.courseCode === "string" ? c.courseCode : null,
    hasWeeklySchedule:
      typeof c.hasWeeklySchedule === "boolean" ? c.hasWeeklySchedule : false,
    clos: Array.isArray(c.clos) ? (c.clos as SyllabusClo[]) : [],
    assessmentActivities: Array.isArray(c.assessmentActivities)
      ? (c.assessmentActivities as SyllabusAssessmentActivity[])
      : [],
    weeklyScheduleItems: Array.isArray(c.weeklyScheduleItems)
      ? (c.weeklyScheduleItems as SyllabusWeekItem[])
      : [],
    totalWeeks:
      typeof c.totalWeeks === "number" ? c.totalWeeks : DEFAULT_WEEK_COUNT,
    quizzes: (function migrateQuizzes() {
      const q = (c.quizzes || {}) as Record<string, any>;
      const newQ: Record<string, Quiz[]> = {};
      for (const [w, val] of Object.entries(q)) {
        if (Array.isArray(val)) {
          newQ[w] = val;
        } else if (val) {
          // It was a single quiz, convert to array
          newQ[w] = [{ ...val, id: val.id || "migrated", isActive: true }];
        }
      }
      return newQ;
    })(),
  } as Course;
}

/** แปลงข้อมูลเก่า (วิชาเดียว) → โครงใหม่ (หลายวิชา) */
function migrate(
  data: unknown,
): { courses: Course[]; studentId: string | null; activeCourseId: string | null } {
  const d = data as Record<string, unknown>;
  const studentId = typeof d.studentId === "string" ? d.studentId : null;
  const activeCourseId =
    typeof d.activeCourseId === "string" ? d.activeCourseId : null;

  // โครงใหม่อยู่แล้ว
  if (Array.isArray(d.courses)) {
    return {
      courses: (d.courses as Record<string, unknown>[]).map(backfillCourse),
      studentId,
      activeCourseId,
    };
  }

  // โครงเก่า: มี subject/topics/… อยู่ระดับบนสุด → ห่อเป็น 1 วิชา
  const hasOld =
    typeof d.subject === "string" ||
    Array.isArray(d.topics) ||
    (d.quizzes && typeof d.quizzes === "object");

  if (hasOld) {
    const course: Course = {
      id: makeId("course"),
      subject: typeof d.subject === "string" ? d.subject : "",
      syllabusName:
        typeof d.syllabusName === "string" ? d.syllabusName : null,
      syllabusData:
        typeof d.syllabusData === "string" ? d.syllabusData : null,
      courseCode: typeof d.courseCode === "string" ? d.courseCode : null,
      hasWeeklySchedule:
        typeof d.hasWeeklySchedule === "boolean" ? d.hasWeeklySchedule : false,
      clos: Array.isArray(d.clos) ? (d.clos as SyllabusClo[]) : [],
      assessmentActivities: Array.isArray(d.assessmentActivities)
        ? (d.assessmentActivities as SyllabusAssessmentActivity[])
        : [],
      weeklyScheduleItems: Array.isArray(d.weeklyScheduleItems)
        ? (d.weeklyScheduleItems as SyllabusWeekItem[])
        : [],
      totalWeeks:
        typeof d.totalWeeks === "number" ? d.totalWeeks : DEFAULT_WEEK_COUNT,
      topics: Array.isArray(d.topics) ? (d.topics as Topic[]) : freshTopics(),
      weekConfig: (d.weekConfig as WeekConfigMap) ?? {},
      quizzes: (function migrateOldQuizzes() {
        const q = (d.quizzes || {}) as Record<string, any>;
        const newQ: Record<string, Quiz[]> = {};
        for (const [w, val] of Object.entries(q)) {
          if (Array.isArray(val)) {
            newQ[w] = val;
          } else if (val) {
            newQ[w] = [{ ...val, id: val.id || "migrated", isActive: true }];
          }
        }
        return newQ;
      })(),
      submissions: Array.isArray(d.submissions)
        ? (d.submissions as Submission[])
        : [],
      createdAt: new Date().toISOString(),
    };
    return { courses: [course], studentId, activeCourseId: course.id };
  }

  return { courses: [], studentId, activeCourseId: null };
}

export function CourseProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // โหลดจาก localStorage ตอน mount (ฝั่ง client เท่านั้น)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const {
          courses: loaded,
          studentId: sid,
          activeCourseId: savedActiveId,
        } = migrate(JSON.parse(raw));
        setCourses(loaded);
        setStudentId(sid);
        // คงวิชาที่เคยเปิดทำงานอยู่ไว้หลัง refresh — กลับไปวิชาแรกสุดก็ต่อเมื่อ
        // ไม่มีค่าที่บันทึกไว้ หรือวิชานั้นถูกลบไปแล้วเท่านั้น
        const stillExists =
          savedActiveId && loaded.some((c) => c.id === savedActiveId);
        if (stillExists) {
          setActiveCourseId(savedActiveId);
        } else if (loaded.length > 0) {
          setActiveCourseId(loaded[0].id);
        }
      }
    } catch {
      // localStorage เสีย/ปิดอยู่ — เริ่มจากว่าง
    }
    setHydrated(true);
  }, []);

  // บันทึกทุกครั้งที่ state เปลี่ยน (หลัง hydrate แล้วเท่านั้น)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ courses, activeCourseId, studentId }),
      );
    } catch {
      // เขียนไม่ได้ก็ข้ามไป (เช่นไฟล์ใหญ่เกินโควตา localStorage)
    }
  }, [hydrated, courses, activeCourseId, studentId]);

  const activeCourse =
    courses.find((c) => c.id === activeCourseId) ?? null;

  /** อัปเดตเฉพาะวิชาที่ active ผ่านฟังก์ชัน transform */
  function updateActive(fn: (c: Course) => Course) {
    setCourses((prev) =>
      prev.map((c) => (c.id === activeCourseId ? fn(c) : c)),
    );
  }

  function addCourse(
    subject: string,
    syllabusName: string | null,
    syllabusData: string | null,
    initialTopics?: Topic[],
    syllabusExtraction?: SyllabusExtraction | null,
  ): string {
    const course = emptyCourse(
      subject,
      syllabusName,
      syllabusData,
      initialTopics,
      syllabusExtraction,
    );
    setCourses((prev) => [...prev, course]);
    setActiveCourseId(course.id);
    return course.id;
  }

  function getCourse(id: string) {
    return courses.find((c) => c.id === id);
  }

  /* ---- accessor ของวิชาที่ active ---- */

  const setTopics: Dispatch<SetStateAction<Topic[]>> = (update) => {
    updateActive((c) => ({
      ...c,
      topics:
        typeof update === "function"
          ? (update as (p: Topic[]) => Topic[])(c.topics)
          : update,
    }));
  };

  const setWeekConfig: Dispatch<SetStateAction<WeekConfigMap>> = (update) => {
    updateActive((c) => ({
      ...c,
      weekConfig:
        typeof update === "function"
          ? (update as (p: WeekConfigMap) => WeekConfigMap)(c.weekConfig)
          : update,
    }));
  };

  function setSyllabus(name: string | null, data: string | null) {
    updateActive((c) => ({ ...c, syllabusName: name, syllabusData: data }));
  }

  function setSyllabusExtraction(extraction: SyllabusExtraction) {
    updateActive((c) => ({
      ...c,
      courseCode: extraction.course_code,
      hasWeeklySchedule: extraction.has_weekly_schedule,
      clos: extraction.clos,
      assessmentActivities: extraction.assessment_activities,
      weeklyScheduleItems: extraction.items,
    }));
  }

  function addClo(code: string, description: string | null) {
    updateActive((c) => ({
      ...c,
      clos: [...c.clos, { code, description }],
    }));
  }

  function addWeek() {
    updateActive((c) => ({ ...c, totalWeeks: c.totalWeeks + 1 }));
  }

  function removeWeek() {
    updateActive((c) => {
      if (c.totalWeeks <= 1) return c;
      const lastWeek = `สัปดาห์ที่ ${c.totalWeeks}`;
      const inUse = c.topics.some((t) => t.weekAssigned === lastWeek);
      if (inUse) return c;
      return { ...c, totalWeeks: c.totalWeeks - 1 };
    });
  }

  function saveQuiz(week: string, quiz: Quiz) {
    updateActive((c) => {
      const existing = c.quizzes[week] || [];
      const index = existing.findIndex((q) => q.id === quiz.id);
      
      let nextList = [...existing];
      if (index >= 0) {
        nextList[index] = quiz;
      } else {
        // If it's a new quiz and it's the first one, make it active
        const newQuiz = { ...quiz, isActive: existing.length === 0 ? true : quiz.isActive };
        nextList.push(newQuiz);
      }

      return {
        ...c,
        quizzes: { ...c.quizzes, [week]: nextList },
      };
    });
  }

  function getQuiz(week: string) {
    const list = activeCourse?.quizzes[week];
    if (!list || list.length === 0) return undefined;
    return list.find((q) => q.isActive) || list[0];
  }

  function toggleQuizActive(week: string, quizId: string) {
    updateActive((c) => {
      const existing = c.quizzes[week] || [];
      const updated = existing.map((q) => ({
        ...q,
        isActive: q.id === quizId,
      }));
      return {
        ...c,
        quizzes: { ...c.quizzes, [week]: updated },
      };
    });
  }

  function deleteQuiz(week: string, quizId: string) {
    updateActive((c) => {
      const existing = c.quizzes[week] || [];
      let remaining = existing.filter((q) => q.id !== quizId);
      // ถ้าลบตัวที่ active ไปแล้วยังเหลือควิซอื่น → ตั้งตัวแรกเป็น active แทน
      if (remaining.length > 0 && !remaining.some((q) => q.isActive)) {
        remaining = remaining.map((q, i) => ({ ...q, isActive: i === 0 }));
      }
      const nextQuizzes = { ...c.quizzes };
      if (remaining.length === 0) {
        delete nextQuizzes[week];
      } else {
        nextQuizzes[week] = remaining;
      }
      return { ...c, quizzes: nextQuizzes };
    });
  }

  function addTopics(newTopics: Topic[]) {
    updateActive((c) => ({ ...c, topics: [...c.topics, ...newTopics] }));
  }

  /** บันทึกผลการทำแบบทดสอบเข้าวิชาที่ active — คนเดิม/สัปดาห์เดิม ทับของเก่า */
  function saveSubmission(submission: Submission) {
    updateActive((c) => ({
      ...c,
      submissions: [
        ...c.submissions.filter(
          (s) =>
            !(
              s.week === submission.week &&
              s.studentId === submission.studentId
            ),
        ),
        submission,
      ],
    }));
  }

  function getSubmissions(week: string) {
    return (activeCourse?.submissions ?? []).filter((s) => s.week === week);
  }

  return (
    <CourseContext.Provider
      value={{
        courses,
        activeCourseId,
        activeCourse,
        setActiveCourse: setActiveCourseId,
        addCourse,
        getCourse,

        subject: activeCourse?.subject ?? "",
        syllabusName: activeCourse?.syllabusName ?? null,
        syllabusData: activeCourse?.syllabusData ?? null,
        setSyllabus,
        courseCode: activeCourse?.courseCode ?? null,
        hasWeeklySchedule: activeCourse?.hasWeeklySchedule ?? false,
        clos: activeCourse?.clos ?? [],
        assessmentActivities: activeCourse?.assessmentActivities ?? [],
        weeklyScheduleItems: activeCourse?.weeklyScheduleItems ?? [],
        setSyllabusExtraction,
        addClo,
        totalWeeks: activeCourse?.totalWeeks ?? DEFAULT_WEEK_COUNT,
        addWeek,
        removeWeek,
        topics: activeCourse?.topics ?? [],
        setTopics,
        weekConfig: activeCourse?.weekConfig ?? {},
        setWeekConfig,
        quizzes: activeCourse?.quizzes ?? {},
        saveQuiz,
        getQuiz,
        toggleQuizActive,
        deleteQuiz,
        addTopics,

        studentId,
        setStudentId,
        submissions: activeCourse?.submissions ?? [],
        saveSubmission,
        getSubmissions,

        hydrated,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

/** เข้าถึงสถานะรายวิชา (ต้องอยู่ใต้ <CourseProvider>) */
export function useCourse(): CourseContextValue {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error("useCourse ต้องใช้ภายใน <CourseProvider>");
  return ctx;
}
