import { StudentShell } from "@/components/ui/Shells";
import StudentCourseWeeks from "@/components/student/StudentCourseWeeks";

export default function StudentCoursePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <StudentShell>
      <StudentCourseWeeks courseId={params.id} />
    </StudentShell>
  );
}
