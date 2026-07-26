import { TeacherShell } from "@/components/ui/Shells";
import StudentReport from "@/components/teacher/report/StudentReport";

export default function StudentReportPage({
  params,
}: {
  params: { id: string; week: string; studentId: string };
}) {
  const week = `สัปดาห์ที่ ${params.week}`;

  return (
    <TeacherShell>
      <StudentReport
        courseId={params.id}
        week={week}
        studentId={decodeURIComponent(params.studentId)}
      />
    </TeacherShell>
  );
}
