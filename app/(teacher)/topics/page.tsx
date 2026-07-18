import Link from "next/link";
import Brand from "@/components/ui/Brand";
import TopicWorkspace from "@/components/teacher/topics/TopicWorkspace";

export default function TopicsPage() {
  return (
    <main className="min-h-screen bg-cream-100 p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <Brand />
          <Link
            href="/course"
            className="rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-tu-red-600 ring-1 ring-slate-200 transition hover:bg-tu-red-50"
          >
            ภาพรวมรายวิชา →
          </Link>
        </header>
        <TopicWorkspace />
      </div>
    </main>
  );
}
