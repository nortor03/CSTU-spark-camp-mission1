import { StudentShell } from "@/components/ui/Shells";
import StudentQuizList from "@/components/student/StudentQuizList";

export default function StudentHomePage() {
  return (
    <StudentShell>
      <StudentQuizList />
    </StudentShell>
  );
}
