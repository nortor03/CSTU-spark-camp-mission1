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

import { LogOut, User } from "lucide-react";

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
];

/** ปุ่มออกจากระบบบนแถบแดง */
function SignOut({ href, role }: { href: string; role: string }) {
  const isTeacher = role === "อาจารย์";
  return (
    <div className="flex items-center gap-3">
      {/* Role Badge Container */}
      <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-xs ring-1 ring-white/10">
        <div className={`flex h-5 w-5 items-center justify-center rounded-lg ${
          isTeacher ? "bg-tu-gold-500 text-tu-red-700" : "bg-white text-tu-red-600"
        }`}>
          <User className="h-3.5 w-3.5" strokeWidth={2.5} />
        </div>
        <span className="text-xs font-bold tracking-wide text-white/90">
          {role}
        </span>
      </div>
      
      {/* Logout Button */}
      <Link
        href={href}
        className="group flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs ring-1 ring-white/20 transition-all duration-200 hover:bg-white hover:text-tu-red-700 hover:ring-white active:scale-95"
      >
        <span>ออกจากระบบ</span>
        <LogOut className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
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
