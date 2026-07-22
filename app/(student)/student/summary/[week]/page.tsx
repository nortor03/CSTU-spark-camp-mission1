import { StudentShell } from "@/components/ui/Shells";
import StudentSummary from "@/components/student/StudentSummary";

export default function StudentSummaryPage({
  params,
}: {
  params: { week: string };
}) {
  const week = `สัปดาห์ที่ ${params.week}`;

  return (
    <StudentShell>
      <StudentSummary week={week} />
    </StudentShell>
  );
}
