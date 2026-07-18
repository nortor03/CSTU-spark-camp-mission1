import Link from "next/link";
import Brand from "@/components/ui/Brand";
import StudentQuizList from "@/components/student/StudentQuizList";

export default function StudentHomePage() {
  return (
    <main className="min-h-screen bg-cream-100 p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <Brand />
          <Link
            href="/student/login"
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-700"
          >
            ออกจากระบบ
          </Link>
        </header>
        <StudentQuizList />
      </div>
    </main>
  );
}
