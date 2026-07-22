import { LEVEL_META, type TopicMastery } from "@/lib/analytics";

/**
 * แถบแสดงความเข้าใจรายหัวข้อ
 *
 * หลักการออกแบบ:
 * - ระดับความเข้าใจเป็น "ขั้ว" (อ่อน ↔ แข็ง) จึงใช้สองสีตรงข้าม เขียว/แดง
 *   และเทาเป็นกลาง — ไม่ใช่ไล่เฉดตามค่าซึ่งจะซ้ำกับความยาวแถบ
 * - ไม่สื่อด้วยสีอย่างเดียว มีทั้งไอคอน ข้อความระดับ และตัวเลขกำกับเสมอ
 */
export default function MasteryBar({ item }: { item: TopicMastery }) {
  const meta = LEVEL_META[item.level];

  return (
    <div className="py-2.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium text-ink-800">
          {item.topic}
        </span>
        <span className="flex flex-shrink-0 items-baseline gap-2 text-xs">
          <span
            className="font-semibold"
            style={{ color: meta.hex }}
            aria-hidden
          >
            {meta.icon}
          </span>
          <span className="font-medium text-ink-600">{meta.label}</span>
          <span className="tabular-nums font-bold text-ink-800">
            {item.percent}%
          </span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-200"
          role="img"
          aria-label={`${item.topic}: ถูก ${item.correct} จาก ${item.total} ข้อ (${item.percent}%) ระดับ${meta.label}`}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${item.percent}%`, backgroundColor: meta.hex }}
          />
        </div>
        <span className="flex-shrink-0 text-[11px] tabular-nums text-ink-400">
          {item.correct}/{item.total} ข้อ
        </span>
      </div>
    </div>
  );
}

/** คำอธิบายเกณฑ์สี — ใช้คู่กับกลุ่มของ MasteryBar */
export function MasteryLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-500">
      {(["strong", "medium", "weak"] as const).map((lv) => (
        <span key={lv} className="flex items-center gap-1.5">
          <span style={{ color: LEVEL_META[lv].hex }} aria-hidden>
            {LEVEL_META[lv].icon}
          </span>
          {LEVEL_META[lv].label}
          <span className="text-ink-400">
            {lv === "strong" ? "(≥80%)" : lv === "weak" ? "(<50%)" : "(50–79%)"}
          </span>
        </span>
      ))}
    </div>
  );
}
