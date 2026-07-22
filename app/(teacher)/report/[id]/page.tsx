import { TeacherShell } from "@/components/ui/Shells";
import ReportWeekList from "@/components/teacher/report/ReportWeekList";

export default function ReportCoursePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <TeacherShell>
      <ReportWeekList courseId={params.id} />
    </TeacherShell>
  );
}
