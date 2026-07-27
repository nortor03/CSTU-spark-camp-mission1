import { StudentShell } from "@/components/ui/Shells";
import StudentSummaryWeeks from "@/components/student/StudentSummaryWeeks";

export default function StudentSummaryCoursePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <StudentShell>
      <StudentSummaryWeeks courseId={params.id} />
    </StudentShell>
  );
}
