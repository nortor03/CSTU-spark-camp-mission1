import { StudentShell } from "@/components/ui/Shells";
import StudentSummarySelect from "@/components/student/StudentSummarySelect";

export default function StudentSummaryIndexPage() {
  return (
    <StudentShell>
      <StudentSummarySelect />
    </StudentShell>
  );
}
