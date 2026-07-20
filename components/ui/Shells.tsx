"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import AppShell, {
  IconCourse,
  IconQuiz,
  IconTopics,
  IconUpload,
  type NavItem,
} from "./AppShell";

const TEACHER_NAV: NavItem[] = [
  {
    href: "/course",
    label: "ภาพรวมรายวิชา",
    match: ["/quiz"],
    icon: IconCourse,
  },
  { href: "/topics", label: "จัดหัวข้อ", icon: IconTopics },
  { href: "/upload", label: "อัปโหลดเอกสาร", icon: IconUpload },
];

const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "แบบทดสอบ", match: ["/student/quiz"], icon: IconQuiz },
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
    <AppShell
      nav={TEACHER_NAV}
      width={width}
      action={<SignOut href="/login" role="อาจารย์" />}
    >
      {children}
    </AppShell>
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
    <AppShell
      nav={STUDENT_NAV}
      width={width}
      action={<SignOut href="/student/login" role="นักเรียน" />}
    >
      {children}
    </AppShell>
  );
}
