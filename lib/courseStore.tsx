"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Topic, WeekConfigMap } from "./types";
import type { Quiz } from "./quiz";
import { MOCK_AI_TOPICS } from "./mockTopics";

/**
 * สถานะกลางของทั้งรายวิชา — แชร์ข้ามทุกหน้าและเก็บลง localStorage
 * (แทน backend จริง เพื่อให้ flow อัปโหลด → จัดหัวข้อ → สร้างควิซ ต่อเนื่องกัน)
 */
interface CourseContextValue {
  subject: string;
  syllabusName: string | null;
  /** เนื้อไฟล์ course syllabus เป็น data URL (ใช้สำหรับดาวน์โหลด) */
  syllabusData: string | null;
  /** ตั้ง/เปลี่ยน course syllabus (name + data URL) */
  setSyllabus: (name: string | null, data: string | null) => void;
  topics: Topic[];
  setTopics: React.Dispatch<React.SetStateAction<Topic[]>>;
  weekConfig: WeekConfigMap;
  setWeekConfig: React.Dispatch<React.SetStateAction<WeekConfigMap>>;
  /** ควิซที่บันทึกไว้ราย "สัปดาห์" (key = ป้ายสัปดาห์ เช่น "สัปดาห์ที่ 3") */
  quizzes: Record<string, Quiz>;
  saveQuiz: (week: string, quiz: Quiz) => void;
  getQuiz: (week: string) => Quiz | undefined;
  /** เริ่มรายวิชาใหม่จากหน้าอัปโหลด — รีเซ็ตหัวข้อ/สี/ควิซ */
  startCourse: (
    subject: string,
    syllabusName: string | null,
    syllabusData: string | null,
  ) => void;
  hydrated: boolean;
}

const CourseContext = createContext<CourseContextValue | null>(null);

const STORAGE_KEY = "tonlabkit:course";

/** หัวข้อชุดใหม่ (ยังไม่จัดเข้าสัปดาห์) — จำลองผลวิเคราะห์จาก AI */
function freshTopics(): Topic[] {
  return MOCK_AI_TOPICS.map((t) => ({
    ...t,
    selected: false,
    weekAssigned: null,
    aiGenerated: true,
  }));
}

export function CourseProvider({ children }: { children: ReactNode }) {
  const [subject, setSubject] = useState("");
  const [syllabusName, setSyllabusName] = useState<string | null>(null);
  const [syllabusData, setSyllabusData] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>(freshTopics);
  const [weekConfig, setWeekConfig] = useState<WeekConfigMap>({});
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [hydrated, setHydrated] = useState(false);

  // โหลดจาก localStorage ตอน mount (ฝั่ง client เท่านั้น)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.subject === "string") setSubject(data.subject);
        if (typeof data.syllabusName === "string" || data.syllabusName === null)
          setSyllabusName(data.syllabusName);
        if (typeof data.syllabusData === "string" || data.syllabusData === null)
          setSyllabusData(data.syllabusData);
        if (Array.isArray(data.topics)) setTopics(data.topics);
        if (data.weekConfig) setWeekConfig(data.weekConfig);
        if (data.quizzes) setQuizzes(data.quizzes);
      }
    } catch {
      // localStorage เสีย/ปิดอยู่ — ใช้ค่าเริ่มต้น
    }
    setHydrated(true);
  }, []);

  // บันทึกทุกครั้งที่ state เปลี่ยน (หลัง hydrate แล้วเท่านั้น)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          subject,
          syllabusName,
          syllabusData,
          topics,
          weekConfig,
          quizzes,
        }),
      );
    } catch {
      // เขียนไม่ได้ก็ข้ามไป (เช่นไฟล์ใหญ่เกินโควตา localStorage)
    }
  }, [hydrated, subject, syllabusName, syllabusData, topics, weekConfig, quizzes]);

  function saveQuiz(week: string, quiz: Quiz) {
    setQuizzes((prev) => ({ ...prev, [week]: quiz }));
  }

  function getQuiz(week: string) {
    return quizzes[week];
  }

  function setSyllabus(name: string | null, data: string | null) {
    setSyllabusName(name);
    setSyllabusData(data);
  }

  function startCourse(
    newSubject: string,
    newSyllabus: string | null,
    newSyllabusData: string | null,
  ) {
    setSubject(newSubject);
    setSyllabusName(newSyllabus);
    setSyllabusData(newSyllabusData);
    setTopics(freshTopics());
    setWeekConfig({});
    setQuizzes({});
  }

  return (
    <CourseContext.Provider
      value={{
        subject,
        syllabusName,
        syllabusData,
        setSyllabus,
        topics,
        setTopics,
        weekConfig,
        setWeekConfig,
        quizzes,
        saveQuiz,
        getQuiz,
        startCourse,
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
