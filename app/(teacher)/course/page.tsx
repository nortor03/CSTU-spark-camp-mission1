import { TeacherShell } from "@/components/ui/Shells";
import CourseList from "@/components/teacher/course/CourseList";

export default function CoursePage() {
  return (
    <TeacherShell>
      <CourseList />
    </TeacherShell>
  );
}
