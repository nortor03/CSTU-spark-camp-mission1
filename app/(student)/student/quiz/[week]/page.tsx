import Link from "next/link";
import Brand from "@/components/ui/Brand";
import StudentQuiz from "@/components/student/StudentQuiz";

export default function StudentQuizPage({
  params,
}: {
  params: { week: string };
}) {
  const week = `สัปดาห์ที่ ${params.week}`;

  return (
    <main className="min-h-screen bg-cream-100 p-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between">
          <Brand />
          <Link
            href="/student"
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-700"
          >
            ← เลือกสัปดาห์อื่น
          </Link>
        </header>
        <StudentQuiz week={week} />
      </div>
    </main>
  );
}
