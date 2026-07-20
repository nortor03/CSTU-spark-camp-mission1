/**
 * โลโก้/แบรนด์ TONLABKIT
 * ตราสัญลักษณ์เป็นสี่เหลี่ยมแดงมีเส้นทองขีดใต้ — โทน editorial
 */
export default function Brand({
  size = "md",
  variant = "dark",
}: {
  size?: "sm" | "md" | "lg";
  /** light = ใช้บนพื้นเข้ม/แถบแดง */
  variant?: "dark" | "light";
}) {
  const mark = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-base",
  }[size];

  const title = {
    sm: "text-sm",
    md: "text-[15px]",
    lg: "text-xl",
  }[size];

  const light = variant === "light";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`relative grid flex-shrink-0 place-items-center rounded-md font-bold tracking-tight ${mark} ${
          light ? "bg-white text-tu-red-600" : "bg-tu-red-500 text-white"
        }`}
        aria-hidden
      >
        <span className="leading-none">TLK</span>
        {/* ขีดทองใต้ตัวอักษร */}
        <span
          className={`absolute inset-x-1.5 bottom-1 h-px ${
            light ? "bg-tu-red-300" : "bg-tu-gold-400"
          }`}
        />
      </div>

      <div className="leading-tight">
        <p
          className={`display font-bold ${title} ${
            light ? "text-white" : "text-ink-900"
          }`}
        >
          TONLABKIT
        </p>
        <p
          className={`text-[10.5px] tracking-wide ${
            light ? "text-white/65" : "text-ink-400"
          }`}
        >
          ระบบจัดการเอกสารการสอน
        </p>
      </div>
    </div>
  );
}
