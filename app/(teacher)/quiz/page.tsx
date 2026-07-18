import { redirect } from "next/navigation";

// รวมหน้าเลือกสัปดาห์เข้ากับหน้าภาพรวมรายวิชา
export default function QuizIndexPage() {
  redirect("/course");
}
