import Brand from "@/components/ui/Brand";
import CourseHub from "@/components/teacher/course/CourseHub";

export default function CoursePage() {
  return (
    <main className="min-h-screen bg-cream-100 p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <Brand />
        </header>
        <CourseHub />
      </div>
    </main>
  );
}
