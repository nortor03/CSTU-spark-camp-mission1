import { StudentShell } from "@/components/ui/Shells";
import StudentOverallSummary from "@/components/student/StudentOverallSummary";

export default function StudentOverallSummaryPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <StudentShell>
      <StudentOverallSummary courseId={params.id} />
    </StudentShell>
  );
}
