import { StudentShell } from "@/components/ui/Shells";
import StudentQuiz from "@/components/student/StudentQuiz";

export default function StudentQuizPage({
  params,
}: {
  params: { week: string };
}) {
  const week = `สัปดาห์ที่ ${params.week}`;

  return (
    <StudentShell width="max-w-2xl">
      <StudentQuiz week={week} />
    </StudentShell>
  );
}
