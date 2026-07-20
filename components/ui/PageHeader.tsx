import type { ReactNode } from "react";

/**
 * หัวหน้าเพจมาตรฐาน — ป้ายหมวด + หัวเรื่อง serif + เส้นทอง + คำอธิบาย
 * ใช้ทุกหน้าเพื่อให้จังหวะการอ่านเหมือนกันทั้งแอป
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  tone = "red",
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** ปุ่มมุมขวา */
  action?: ReactNode;
  tone?: "red" | "gold";
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className={tone === "gold" ? "eyebrow-gold" : "eyebrow"}>{eyebrow}</p>
        <h1 className="display mt-1.5 text-[28px] leading-tight sm:text-3xl">
          {title}
        </h1>
        <hr className="rule-gold my-3" />
        {subtitle && (
          <p className="max-w-xl text-sm leading-relaxed text-ink-500">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex flex-shrink-0 gap-2">{action}</div>}
    </div>
  );
}
