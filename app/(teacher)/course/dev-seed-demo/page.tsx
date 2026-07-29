"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import { buildMockCourseSeed } from "@/lib/mockCourseSeed";
import { generateMockSubmissions } from "@/lib/mockClass";
import type { Quiz } from "@/lib/quiz";

/**
 * หน้าชั่วคราวสำหรับ demo เท่านั้น (ไม่ใช่ฟีเจอร์ถาวร ลบทิ้งได้ทุกเมื่อ)
 * สร้างวิชาตัวอย่างหลายวิชาพร้อมกัน (หัวข้อ + CLO + ควิซ + ผลเพื่อนร่วมชั้นจำลอง)
 * ให้ฝั่งอาจารย์มีข้อมูลดูทันที โดยไม่ต้องกดสร้างรายวิชาใหม่เองทุกครั้ง
 *
 * ใช้ได้เฉพาะตอนเชื่อม backend รายวิชาไม่ได้ (หน้า /course จะ fallback มาแสดง
 * วิชาที่เก็บในเครื่องนี้เอง) — ถ้า backend เชื่อมได้ วิชาพวกนี้จะไม่ถูกแสดงที่ /course
 */

interface CourseSpec {
  id: string;
  code: string;
  subject: string;
  totalWeeks: number;
  quizWeeks: number;
  /** ใช้แทนชุด CLO เริ่มต้น (4 อัน) เฉพาะวิชาที่อยากโชว์กรณีมี CLO เยอะ ๆ เช่นตาราง scroll แนวนอน */
  cloOverride?: { code: string; description: string }[];
}

/** ชุด CLO 8 อัน — ใช้โชว์ว่าตารางสรุปรายบุคคล/รายสัปดาห์ต้องเลื่อนแนวนอนได้เมื่อคอลัมน์เยอะ */
const MANY_CLOS = [
  { code: "CLO 1", description: "สามารถอธิบายหลักการและแนวคิดพื้นฐานของการเขียนโปรแกรมได้" },
  { code: "CLO 2", description: "สามารถวิเคราะห์ปัญหาและออกแบบอัลกอริทึมเบื้องต้นได้" },
  { code: "CLO 3", description: "สามารถประยุกต์ใช้โครงสร้างควบคุม (Control Structures) ในการแก้ปัญหาได้" },
  { code: "CLO 4", description: "สามารถเขียนและแก้ไขข้อผิดพลาด (Debugging) ของโปรแกรมได้" },
  { code: "CLO 5", description: "สามารถออกแบบและใช้งานฟังก์ชัน (Functions) เพื่อแบ่งปัญหาย่อยได้" },
  { code: "CLO 6", description: "สามารถเลือกใช้โครงสร้างข้อมูล (Data Structures) พื้นฐานได้อย่างเหมาะสม" },
  { code: "CLO 7", description: "สามารถเขียนโปรแกรมโดยยึดหลักการอ่านง่ายและบำรุงรักษาได้" },
  { code: "CLO 8", description: "สามารถทำงานร่วมกับผู้อื่นและนำเสนอผลงานโปรแกรมได้" },
];

/** ผูกแต่ละคำถามเข้ากับ CLO วนไปเรื่อย ๆ — generateMockQuiz ปกติไม่ใส่ relatedClos ให้
 *  (ทำเฉพาะใน demo นี้ เพื่อให้ CLO radar ในหน้ารายงานมีข้อมูลให้ดู) */
function tagWithClos(quiz: Quiz, cloCodes: string[]): Quiz {
  if (cloCodes.length === 0) return quiz;
  return {
    ...quiz,
    questions: quiz.questions.map((q, i) => ({
      ...q,
      relatedClos: [cloCodes[i % cloCodes.length]],
    })),
  };
}

// หมายเหตุ: มี "-v3" ต่อท้าย id เพื่อกันชนกับข้อมูล demo รุ่นเก่าที่ค้างใน localStorage
// (รุ่นนี้เพิ่ม cloOverride ให้ CN101 มี 8 CLO แทน 4 อัน เพื่อโชว์ตาราง scroll แนวนอน)
const COURSE_SPECS: CourseSpec[] = [
  {
    id: "course-demo-teacher-cn101-v4",
    code: "CN101-CLO8",
    subject: "การเขียนโปรแกรมเบื้องต้น (ตัวอย่าง 8 CLO)",
    totalWeeks: 6,
    quizWeeks: 4,
    cloOverride: MANY_CLOS,
  },
  { id: "course-demo-teacher-cs232-v3", code: "CS232", subject: "โครงสร้างข้อมูลและอัลกอริทึม", totalWeeks: 6, quizWeeks: 3 },
  { id: "course-demo-teacher-ge145-v3", code: "GE145", subject: "การคิดเชิงออกแบบ", totalWeeks: 6, quizWeeks: 2 },
];

export default function TeacherDevSeedDemoPage() {
  const router = useRouter();
  const { hydrated, activeCourseId, getCourse, addCourse, saveSubmission } =
    useCourse();

  const [step, setStep] = useState(0); // ดัชนีวิชาที่กำลังสร้าง/เติมข้อมูลอยู่
  const createdRef = useRef(-1); // step ล่าสุดที่สั่ง addCourse ไปแล้ว (กันยิงซ้ำ)
  const seededRef = useRef(-1); // step ล่าสุดที่เติม submissions เสร็จแล้ว
  const [status, setStatus] = useState("กำลังเตรียมข้อมูลตัวอย่าง…");

  // Step A: สร้างวิชาของ step ปัจจุบัน (ทำครั้งเดียวต่อ step)
  useEffect(() => {
    if (!hydrated || step >= COURSE_SPECS.length || createdRef.current === step) return;
    createdRef.current = step;

    const spec = COURSE_SPECS[step];
    const seed = buildMockCourseSeed(
      `${spec.code.toLowerCase()}-syllabus-demo.pdf`,
      spec.code,
      spec.subject,
      spec.totalWeeks,
      spec.quizWeeks,
    );

    // บางวิชาอยากโชว์กรณี CLO เยอะกว่าปกติ (เช่นตาราง scroll แนวนอน) — สลับชุด CLO เริ่มต้นทิ้ง
    if (spec.cloOverride) {
      seed.extraction.clos = spec.cloOverride;
    }

    // ผูกคำถามของทุกควิซเข้ากับ CLO ให้ CLO radar ในหน้ารายงานมีข้อมูลให้ดู
    const cloCodes = seed.extraction.clos.map((c) => c.code);
    for (const week of Object.keys(seed.quizzes)) {
      seed.quizzes[week] = seed.quizzes[week].map((q) => tagWithClos(q, cloCodes));
    }

    addCourse(
      spec.subject,
      `${spec.code.toLowerCase()}-syllabus-demo.pdf`,
      null,
      seed.topics,
      seed.extraction,
      spec.id,
      spec.code,
      seed.quizzes,
    );
    setStatus(`กำลังสร้างผลเพื่อนร่วมชั้นของ ${spec.subject}…`);
  }, [hydrated, step, addCourse]);

  // Step B: พอวิชานี้กลายเป็น active แล้ว ค่อยเติมผลเพื่อนร่วมชั้นจำลอง แล้วไปวิชาถัดไป
  useEffect(() => {
    const spec = COURSE_SPECS[step];
    if (!spec || activeCourseId !== spec.id || seededRef.current === step) return;
    const course = getCourse(spec.id);
    if (!course) return;
    seededRef.current = step;

    for (const week of Object.keys(course.quizzes)) {
      const quiz = course.quizzes[week].find((q) => q.isActive) ?? course.quizzes[week][0];
      if (!quiz) continue;
      for (const sub of generateMockSubmissions(quiz)) {
        saveSubmission(sub);
      }
    }

    if (step + 1 < COURSE_SPECS.length) {
      setStep(step + 1);
    } else {
      setStatus("เสร็จแล้ว กำลังพาไปหน้าภาพรวมรายวิชา…");
      setTimeout(() => router.replace("/course"), 400);
    }
  }, [activeCourseId, step, getCourse, saveSubmission, router]);

  return (
    <div className="grid min-h-screen place-items-center bg-paper-50 px-6 text-center">
      <div>
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-[3px] border-line-strong border-t-tu-red-500" />
        <p className="text-sm text-ink-600">{status}</p>
        <p className="mt-1 text-xs text-ink-400">
          วิชาที่ {Math.min(step + 1, COURSE_SPECS.length)} / {COURSE_SPECS.length}
        </p>
      </div>
    </div>
  );
}
