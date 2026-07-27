import { ChevronDown, ChevronUp } from "lucide-react";
import { LEVEL_META, type ClassReport } from "@/lib/analytics";
import MasteryBar, { MasteryLegend } from "@/components/ui/MasteryBar";

/**
 * กล่องพับ/กาง "การวิเคราะห์เชิงลึก" — รวมส่วนที่ไม่ได้อยู่ในดีไซน์ต้นแบบ
 * แต่ยังมีประโยชน์: การกระจายคะแนน, ความเข้าใจรายหัวข้อ, ข้อที่พลาดมากที่สุด,
 * ข้อเสนอสำหรับคาบถัดไป
 */
export default function DeepAnalysis({
  report,
  open,
  onToggle,
}: {
  report: ClassReport;
  open: boolean;
  onToggle: () => void;
}) {
  const maxBucket = Math.max(...report.distribution.map((b) => b.count), 1);

  return (
    <section className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h2 className="display text-lg">การวิเคราะห์เชิงลึก</h2>
          <p className="mt-1 text-xs text-ink-500">
            การกระจายคะแนน · ความเข้าใจรายหัวข้อ · ข้อที่พลาดมากที่สุด · ข้อเสนอสำหรับคาบถัดไป
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 flex-shrink-0 text-ink-400" />
        ) : (
          <ChevronDown className="h-5 w-5 flex-shrink-0 text-ink-400" />
        )}
      </button>

      {open && (
        <div className="mt-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-ink-800">ข้อเสนอสำหรับคาบถัดไป</h3>
            <hr className="rule-gold my-3" />
            <ul className="space-y-2.5">
              {report.reviewPlan.map((p, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-md bg-paper-50 px-3.5 py-2.5 text-sm leading-relaxed text-ink-700"
                >
                  <span className="flex-shrink-0 font-bold text-tu-red-600">{i + 1}</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold text-ink-800">การกระจายคะแนน</h3>
              <hr className="rule-gold my-3" />
              <div className="space-y-3">
                {report.distribution.map((b) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="w-20 flex-shrink-0 text-xs tabular-nums text-ink-600">
                      {b.label}
                    </span>
                    <div className="h-5 flex-1 overflow-hidden rounded bg-paper-200">
                      <div
                        className="h-full rounded bg-tu-red-500"
                        style={{ width: `${(b.count / maxBucket) * 100}%` }}
                        role="img"
                        aria-label={`${b.label}: ${b.count} คน`}
                      />
                    </div>
                    <span className="w-10 flex-shrink-0 text-right text-xs font-bold tabular-nums text-ink-800">
                      {b.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-ink-800">ความเข้าใจรายหัวข้อ</h3>
              <hr className="rule-gold my-3" />
              <div className="divide-y divide-line-soft">
                {report.topics.map((t) => (
                  <MasteryBar key={t.topic} item={t} />
                ))}
              </div>
              <div className="mt-3 border-t border-line-soft pt-3">
                <MasteryLegend />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-ink-800">ข้อที่นักศึกษาพลาดมากที่สุด</h3>
            <hr className="rule-gold my-3" />
            <div className="space-y-3">
              {report.hardest.map((h, i) => {
                const level = h.correctRate >= 80 ? "strong" : h.correctRate < 50 ? "weak" : "medium";
                const meta = LEVEL_META[level];
                return (
                  <div key={h.question.id} className="rounded-lg border border-line bg-paper-50 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-sm font-medium text-ink-800">
                        <span className="mr-1.5 font-bold text-ink-300">{i + 1}</span>
                        {h.question.question}
                      </p>
                      <span
                        className="flex flex-shrink-0 items-baseline gap-1 text-xs font-bold tabular-nums"
                        style={{ color: meta.hex }}
                      >
                        <span aria-hidden>{meta.icon}</span>
                        {h.correctRate}%
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-tu-gold-700">{h.topic}</p>
                    {h.topWrongCount > 0 && (
                      <p className="mt-2 border-t border-line-soft pt-2 text-xs text-ink-600">
                        <span className="font-semibold text-ink-700">ตัวเลือกผิดยอดนิยม:</span>{" "}
                        <span className="text-tu-red-700">{h.topWrongText}</span> — เลือกโดย{" "}
                        {h.topWrongCount} คน
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
