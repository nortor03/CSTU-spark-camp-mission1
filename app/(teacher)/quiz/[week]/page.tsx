import Link from "next/link";
import Brand from "@/components/ui/Brand";
import QuizGenerator from "@/components/teacher/quiz/QuizGenerator";

/**
 * หน้าสร้างควิซของสัปดาห์ที่เลือก
 * param week = เลขสัปดาห์ (เช่น "3")
 */
export default function QuizWeekPage({
  params,
}: {
  params: { week: string };
}) {
  const week = `สัปดาห์ที่ ${params.week}`;

  return (
    <main className="min-h-screen bg-cream-100 p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <Brand />
          <Link
            href="/quiz"
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-700"
          >
            ← เลือกสัปดาห์อื่น
          </Link>
        </header>

        <QuizGenerator week={week} />
      </div>
    </main>
  );
}
