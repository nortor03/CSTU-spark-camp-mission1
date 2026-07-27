"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import AppShell, {
  IconCourse,
  IconReport,
  type NavItem,
} from "./AppShell";
import StudentAssistant from "@/components/student/StudentAssistant";
import TeacherAssistant from "@/components/teacher/TeacherAssistant";

// เมนูซ้ายเหลือแค่ 2 หัวข้อหลัก — "จัดหัวข้อ" และ "อัปโหลดเอกสาร"
// ย้ายไปเข้าถึงจากภายในหน้ารายละเอียดของแต่ละวิชาแทน
const TEACHER_NAV: NavItem[] = [
  {
    href: "/course",
    label: "ภาพรวมรายวิชา",
    match: ["/quiz", "/topics", "/upload"],
    icon: IconCourse,
  },
  { href: "/report", label: "รายงานชั้นเรียน", icon: IconReport },
];

// เมนูฝั่งนักเรียนเหลือรายการเดียว — "รายวิชา" (เลือกวิชาก่อนทำแบบทดสอบ)
// หมายเหตุ: หน้าควิซ (/student/quiz) และสรุปผล (/student/summary) ยังอยู่ครบ
// เข้าถึงผ่านการเลือกวิชา → สัปดาห์ (ยังไม่ลบ route ทิ้ง)
const STUDENT_NAV: NavItem[] = [
  {
    href: "/student",
    label: "รายวิชา",
    match: ["/student/course", "/student/quiz"],
    icon: IconCourse,
  },
  {
    href: "/student/summary",
    label: "จุดแข็ง / จุดอ่อน",
    match: ["/student/summary"],
    icon: IconReport,
  },
];

/** ปุ่มออกจากระบบบนแถบแดง */
function SignOut({ href, role }: { href: string; role: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs font-medium text-white/70 sm:block">
        {role}
      </span>
      <Link
        href={href}
        className="rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
      >
        ออกจากระบบ
      </Link>
    </div>
  );
}

/** โครงหน้าฝั่งอาจารย์ */
export function TeacherShell({
  children,
  width,
}: {
  children: ReactNode;
  width?: string;
}) {
  return (
    <>
      <AppShell
        nav={TEACHER_NAV}
        width={width}
        homeHref="/course"
        action={<SignOut href="/login" role="อาจารย์" />}
      >
        {children}
      </AppShell>
      {/* ผู้ช่วยจัดการรายวิชา (side panel) — นอก <main> กันกระพริบตอนสลับหน้า */}
      <TeacherAssistant />
    </>
  );
}

/** โครงหน้าฝั่งนักเรียน */
export function StudentShell({
  children,
  width,
}: {
  children: ReactNode;
  width?: string;
}) {
  return (
    <>
      <AppShell
        nav={STUDENT_NAV}
        width={width}
        homeHref="/student"
        action={<SignOut href="/login" role="นักเรียน" />}
      >
        {children}
      </AppShell>
      {/* ผู้ช่วยทบทวน (side panel) — วางนอก <main> ที่มี animate-slide-up
          กัน panel (position:fixed) เด้ง/กระพริบตอนสลับหน้า */}
      <StudentAssistant />
    </>
  );
}
