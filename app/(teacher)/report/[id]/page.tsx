import { TeacherShell } from "@/components/ui/Shells";
import ClassOverallReport from "@/components/teacher/report/ClassOverallReport";

export default function ReportCoursePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <TeacherShell>
      <ClassOverallReport courseId={params.id} />
    </TeacherShell>
  );
}
