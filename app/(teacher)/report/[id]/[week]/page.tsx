import { TeacherShell } from "@/components/ui/Shells";
import ClassReport from "@/components/teacher/report/ClassReport";

export default function ReportWeekPage({
  params,
}: {
  params: { id: string; week: string };
}) {
  const week = `สัปดาห์ที่ ${params.week}`;

  return (
    <TeacherShell>
      <ClassReport courseId={params.id} week={week} />
    </TeacherShell>
  );
}
