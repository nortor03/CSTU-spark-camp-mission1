/**
 * โลโก้/แบรนด์ KroonQuiz
 * ตราสัญลักษณ์เป็นสัญลักษณ์ตัวย่อ KQ โทนพรีเมียมสีแดง-ทอง
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
    sm: "h-9 w-9 text-[12px] rounded-xl",
    md: "h-11 w-11 text-sm rounded-2xl",
    lg: "h-14 w-14 text-lg rounded-2xl",
  }[size];

  const title = {
    sm: "text-[16px]",
    md: "text-[19px]",
    lg: "text-2xl",
  }[size];

  const light = variant === "light";

  return (
    <div className="flex items-center gap-3">
      {/* Icon Logo with gold border and glowing effect */}
      <div
        className={`relative grid flex-shrink-0 place-items-center border transition-all duration-300 shadow-sm ${mark} ${
          light 
            ? "bg-white text-tu-red-700 border-white/20 hover:scale-105" 
            : "bg-gradient-to-br from-tu-red-500 to-tu-red-650 text-white border-tu-red-200/20 hover:scale-105"
        }`}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-1/2 w-1/2"
        >
          {/* Graduation Cap */}
          <path d="M21.4 10.9a1 1 0 0 0 0-1.8L12.8 5.2a2 2 0 0 0-1.6 0L2.6 9.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.6 0l8.6-3.9z" />
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
          {/* Tassel */}
          <path d="M21.5 12H18v5" />
        </svg>

        {/* Small gold checkmark badge on top right */}
        <span
          className={`absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border shadow-2xs ${
            light 
              ? "bg-tu-gold-500 text-white border-white" 
              : "bg-tu-gold-500 text-tu-red-700 border-tu-red-650"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-2.5 w-2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      </div>

      <div className="leading-tight">
        <p
          className={`display font-black tracking-tight ${title} ${
            light ? "text-white" : "text-ink-900"
          }`}
        >
          <span>kroo</span>
          <span className={light ? "text-tu-gold-300" : "text-tu-red-600"}>n</span>
          <span className={light ? "text-white" : "text-ink-900"}>quiz</span>
        </p>
        <p
          className={`text-[9.5px] font-bold uppercase tracking-wider ${
            light ? "text-white/60" : "text-ink-400"
          }`}
        >
          ระบบจัดหมวดหมู่และควิซ AI
        </p>
      </div>
    </div>
  );
}
