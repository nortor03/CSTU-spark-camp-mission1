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
import { MOCK_AI_TOPICS } from "./mockTopics";

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
  topics: Topic[];
  weekConfig: WeekConfigMap;
  /** ควิซราย "สัปดาห์" (key = ป้ายสัปดาห์ เช่น "สัปดาห์ที่ 3") */
  quizzes: Record<string, Quiz>;
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
  ) => string;
  getCourse: (id: string) => Course | undefined;

  /* ---- accessor ของ "วิชาที่ active" (คงชื่อเดิมเพื่อความเข้ากันได้) ---- */
  subject: string;
  syllabusName: string | null;
  syllabusData: string | null;
  setSyllabus: (name: string | null, data: string | null) => void;
  topics: Topic[];
  setTopics: Dispatch<SetStateAction<Topic[]>>;
  weekConfig: WeekConfigMap;
  setWeekConfig: Dispatch<SetStateAction<WeekConfigMap>>;
  quizzes: Record<string, Quiz>;
  saveQuiz: (week: string, quiz: Quiz) => void;
  getQuiz: (week: string) => Quiz | undefined;
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

function emptyCourse(
  subject: string,
  syllabusName: string | null,
  syllabusData: string | null,
  initialTopics?: Topic[],
): Course {
  return {
    id: makeId("course"),
    subject,
    syllabusName,
    syllabusData,
    topics: initialTopics ?? freshTopics(),
    weekConfig: {},
    quizzes: {},
    submissions: [],
    createdAt: new Date().toISOString(),
  };
}

/** แปลงข้อมูลเก่า (วิชาเดียว) → โครงใหม่ (หลายวิชา) */
function migrate(data: unknown): { courses: Course[]; studentId: string | null } {
  const d = data as Record<string, unknown>;
  const studentId = typeof d.studentId === "string" ? d.studentId : null;

  // โครงใหม่อยู่แล้ว
  if (Array.isArray(d.courses)) {
    return { courses: d.courses as Course[], studentId };
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
      topics: Array.isArray(d.topics) ? (d.topics as Topic[]) : freshTopics(),
      weekConfig: (d.weekConfig as WeekConfigMap) ?? {},
      quizzes: (d.quizzes as Record<string, Quiz>) ?? {},
      submissions: Array.isArray(d.submissions)
        ? (d.submissions as Submission[])
        : [],
      createdAt: new Date().toISOString(),
    };
    return { courses: [course], studentId };
  }

  return { courses: [], studentId };
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
        const { courses: loaded, studentId: sid } = migrate(JSON.parse(raw));
        setCourses(loaded);
        setStudentId(sid);
        if (loaded.length > 0) setActiveCourseId(loaded[0].id);
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
  ): string {
    const course = emptyCourse(
      subject,
      syllabusName,
      syllabusData,
      initialTopics,
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

  function saveQuiz(week: string, quiz: Quiz) {
    updateActive((c) => ({
      ...c,
      quizzes: { ...c.quizzes, [week]: quiz },
    }));
  }

  function getQuiz(week: string) {
    return activeCourse?.quizzes[week];
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
        topics: activeCourse?.topics ?? [],
        setTopics,
        weekConfig: activeCourse?.weekConfig ?? {},
        setWeekConfig,
        quizzes: activeCourse?.quizzes ?? {},
        saveQuiz,
        getQuiz,
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
