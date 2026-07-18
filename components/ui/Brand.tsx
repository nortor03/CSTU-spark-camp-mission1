/** โลโก้/แบรนด์ TONLABKIT โทนธรรมศาสตร์ ใช้ซ้ำได้ทุกหน้า */
export default function Brand({
  size = "md",
  variant = "dark",
}: {
  size?: "md" | "lg";
  variant?: "dark" | "light";
}) {
  const isLg = size === "lg";
  const titleColor = variant === "light" ? "text-white" : "text-slate-800";
  const subColor = variant === "light" ? "text-white/70" : "text-slate-400";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`grid place-items-center rounded-2xl bg-tu-red-500 font-bold text-white ${
          isLg ? "h-12 w-12 text-lg" : "h-10 w-10 text-base"
        }`}
        aria-hidden
      >
        <span>
          <span className="text-tu-gold-300">T</span>
          <span>LK</span>
        </span>
      </div>
      <div className="leading-tight">
        <p
          className={`font-bold tracking-tight ${titleColor} ${
            isLg ? "text-xl" : "text-base"
          }`}
        >
          TONLABKIT
        </p>
        <p className={`text-[11px] ${subColor}`}>ระบบจัดการเอกสารการสอน</p>
      </div>
    </div>
  );
}
