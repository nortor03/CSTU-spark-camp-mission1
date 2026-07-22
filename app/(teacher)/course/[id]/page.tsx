import { TeacherShell } from "@/components/ui/Shells";
import CourseDetail from "@/components/teacher/course/CourseDetail";

export default function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <TeacherShell>
      <CourseDetail courseId={params.id} />
    </TeacherShell>
  );
}
