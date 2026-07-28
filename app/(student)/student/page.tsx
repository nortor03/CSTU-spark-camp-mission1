import { StudentShell } from "@/components/ui/Shells";
import StudentCourseSelect from "@/components/student/StudentCourseSelect";

export default function StudentHomePage() {
  return (
    <StudentShell>
      <StudentCourseSelect />
    </StudentShell>
  );
}
