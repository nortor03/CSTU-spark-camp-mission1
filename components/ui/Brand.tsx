/**
 * โลโก้/แบรนด์ kroonquiz
 * ตราสัญลักษณ์เป็นลูกโป่งความคิด (thought bubble) สื่อถึง "กำลังคิด" ก่อนจะถึงคำตอบ
 * จุดไล่ขนาดข้างในแทนความคิดที่กำลังก่อตัว ประกายทองมุมบนแทนไอเดีย
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
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
  }[size];

  const title = {
    sm: "text-[16px]",
    md: "text-[19px]",
    lg: "text-2xl",
  }[size];

  const light = variant === "light";
  const cloudFill = light ? "#7A1020" : "#C8102E";
  const dotFill = light ? "#FBF0EA" : "#FBF0EA";
  const sparkFill = "#F2A900";

  return (
    <div className="flex items-center gap-3">
      {/* Icon: thought bubble — ไม่มีกล่อง/พื้นหลัง ลอยอยู่บนพื้นที่ใช้งานจริงได้เลย */}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className={`flex-shrink-0 transition-transform duration-300 hover:scale-105 ${mark}`}
        aria-hidden
      >
        <circle cx="10" cy="54" r="2.6" fill={cloudFill} />
        <circle cx="16" cy="47" r="4" fill={cloudFill} />
        <circle cx="20" cy="27" r="11" fill={cloudFill} />
        <circle cx="33" cy="17" r="13" fill={cloudFill} />
        <circle cx="47" cy="23" r="11" fill={cloudFill} />
        <circle cx="49" cy="35" r="10" fill={cloudFill} />
        <circle cx="35" cy="41" r="11" fill={cloudFill} />
        <circle cx="22" cy="38" r="10" fill={cloudFill} />
        <circle cx="50" cy="11" r="2.8" fill={sparkFill} />
        <circle cx="24" cy="30" r="2.8" fill={dotFill} />
        <circle cx="33" cy="26" r="3.6" fill={dotFill} />
        <circle cx="44" cy="18" r="4.6" fill={dotFill} />
      </svg>

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
