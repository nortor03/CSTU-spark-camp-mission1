/**
 * หน้าโหลดระหว่างส่งเอกสารให้ AI วิเคราะห์
 * เอกสารไหลเข้าหาบอทเป็นลูป (โทน TU-red) — สไตล์/อนิเมชันอยู่ใน
 * app/globals.css (คลาส .ai-loading*) เคารพ prefers-reduced-motion
 */
export default function AiLoading({
  title = "กำลังวิเคราะห์เอกสาร",
  subtitle = "AI กำลังอ่านสไลด์และจับหัวข้อการสอน",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="ai-loading" role="status" aria-live="polite">
      <div className="ai-loading__stage">
        {/* เอกสาร 3 ใบ ไหลต่อเนื่องเข้าหาบอท */}
        <DocGlyph />
        <DocGlyph />
        <DocGlyph />

        {/* บอท AI */}
        <span className="ai-loading__bot" aria-hidden>
          <svg
            viewBox="0 0 84 72"
            fill="none"
            stroke="currentColor"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* เสาอากาศ */}
            <path d="M30 14l-5-9M54 14l5-9" />
            <circle cx="24" cy="4.5" r="2.5" fill="currentColor" stroke="none" />
            <circle cx="60" cy="4.5" r="2.5" fill="currentColor" stroke="none" />
            {/* หัว */}
            <rect x="14" y="14" width="56" height="44" rx="18" />
            {/* หู */}
            <path d="M14 30c-6 0-9 3-9 8s3 8 9 8M70 30c6 0 9 3 9 8s-3 8-9 8" />
            {/* หน้าจอ */}
            <rect x="26" y="26" width="32" height="20" rx="9" />
            {/* ตา */}
            <circle
              className="ai-loading__eye"
              cx="35"
              cy="36"
              r="3.4"
              fill="currentColor"
              stroke="none"
            />
            <circle
              className="ai-loading__eye"
              cx="49"
              cy="36"
              r="3.4"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </span>
      </div>

      <p className="ai-loading__label">
        {title}
        <span className="ai-loading__dot" />
        <span className="ai-loading__dot" />
        <span className="ai-loading__dot" />
      </p>
      {subtitle && <p className="ai-loading__sub">{subtitle}</p>}
    </div>
  );
}

/** ไอคอนเอกสาร 1 ใบ (มุมพับ + บรรทัด) */
function DocGlyph() {
  return (
    <span className="ai-loading__doc" aria-hidden>
      <svg
        viewBox="0 0 46 56"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M8 3h20l10 10v40H8V3z" />
        <path d="M28 3v10h10" />
        <path d="M15 26h16M15 34h16M15 42h10" />
      </svg>
    </span>
  );
}
