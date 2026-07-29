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
        className={`relative grid flex-shrink-0 place-items-center font-extrabold tracking-tight border transition-all duration-300 shadow-sm ${mark} ${
          light 
            ? "bg-white text-tu-red-700 border-white/20 hover:scale-105" 
            : "bg-gradient-to-br from-tu-red-500 to-tu-red-650 text-white border-tu-red-200/20 hover:scale-105"
        }`}
        aria-hidden
      >
        <span className="leading-none select-none">KQ</span>
        {/* Sparkle decoration */}
        <span
          className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${
            light ? "bg-tu-gold-500" : "bg-tu-gold-400"
          }`}
        />
        {/* Golden underline inside */}
        <span
          className={`absolute inset-x-2 bottom-1.5 h-[1.5px] rounded-full ${
            light ? "bg-tu-red-200" : "bg-tu-gold-400"
          }`}
        />
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
