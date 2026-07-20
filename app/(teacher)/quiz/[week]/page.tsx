import { TeacherShell } from "@/components/ui/Shells";
import QuizGenerator from "@/components/teacher/quiz/QuizGenerator";

/**
 * หน้าสร้างควิซของสัปดาห์ที่เลือก
 * param week = เลขสัปดาห์ (เช่น "3")
 */
export default function QuizWeekPage({
  params,
}: {
  params: { week: string };
}) {
  const week = `สัปดาห์ที่ ${params.week}`;

  return (
    <TeacherShell>
      <QuizGenerator week={week} />
    </TeacherShell>
  );
}
