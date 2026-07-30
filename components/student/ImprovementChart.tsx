"use client";

import { useMemo } from "react";

/** 
 * กราฟเส้นแสดงพัฒนาการ (Improvement History)
 * รับอาร์เรย์คะแนน (0-100)
 */
export default function ImprovementChart({
  scores,
  labels,
}: {
  scores: number[];
  /** ป้ายกำกับแกน X — ถ้าไม่ส่งจะใช้ "Sess 1, 2, …" */
  labels?: string[];
}) {
  const height = 140;
  const padding = 20;
  // เผื่อพื้นที่ด้านบนไว้ให้ label ตัวเลขเหนือจุด ไม่โดนตัดตอนคะแนนใกล้ 100%
  const topPadding = 34;

  const width = 500;
  // คำนวณแกน y (0 = ล่างสุด, 100 = บนสุด)
  const getY = (val: number) =>
    height - padding - (val / 100) * (height - topPadding - padding);

  const { path, points, areaPath } = useMemo(() => {
    // มีแค่ 1 จุด — ยังลากเส้นแนวโน้มไม่ได้ แต่โชว์จุดนิ่ง ๆ ตรงกลางไปก่อน
    if (scores.length === 1) {
      return { path: "", points: [{ x: width / 2, y: getY(scores[0]), val: scores[0] }], areaPath: "" };
    }
    if (scores.length < 1) return { path: "", points: [], areaPath: "" };

    // ให้กราฟขยายเต็มความกว้าง (100%) ดังนั้นใช้ viewBox อัตราส่วนแบบยืดหยุ่น
    // แต่เพื่อวาด SVG กำหนดความกว้างสมมติเป็น 500
    const xStep = (width - padding * 2) / (scores.length - 1);

    const pts = scores.map((s, i) => ({
      x: padding + i * xStep,
      y: getY(s),
      val: s,
    }));

    const linePath = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
      .join(" ");

    // สร้าง gradient area ใต้เส้น
    const aPath = `${linePath} L ${pts[pts.length - 1].x},${height} L ${pts[0].x},${height} Z`;

    return { path: linePath, points: pts, areaPath: aPath };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores]);

  if (scores.length < 1) {
    return (
      <div className="flex h-[140px] w-full items-center justify-center rounded-lg border border-dashed border-line-soft bg-paper-50 text-sm text-ink-400">
        ยังไม่มีข้อมูลให้แสดงแนวโน้ม
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden pt-4 pb-2">
      <svg
        viewBox={`0 0 500 ${height}`}
        preserveAspectRatio="none"
        className="h-[140px] w-full overflow-visible"
      >
        <defs>
          <linearGradient id="redGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#C8102E" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#C8102E" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* พื้นที่สีใต้เส้น */}
        <path d={areaPath} fill="url(#redGradient)" className="chart-fade" />

        {/* เส้นกราฟ */}
        <path
          d={path}
          pathLength={1}
          fill="none"
          stroke="#C8102E"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="chart-draw drop-shadow-sm"
        />

        {/* จุด + ตัวเลขคะแนนกำกับ */}
        <g className="chart-fade-late">
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={5}
                fill="#fff"
                stroke="#C8102E"
                strokeWidth={3}
              />
              <text
                x={p.x}
                y={p.y - 14}
                textAnchor="middle"
                className={`tabular-nums font-extrabold ${
                  i === points.length - 1 ? "fill-tu-red-600" : "fill-ink-700"
                }`}
                style={{ fontSize: 13 }}
              >
                {p.val}%
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* แกน X */}
      <div
        className={`mt-3 flex px-[20px] text-[11px] font-semibold tracking-wide text-ink-400 ${
          scores.length === 1 ? "justify-center" : "justify-between"
        }`}
      >
        {scores.map((_, i) => (
          <span
            key={i}
            className={i === scores.length - 1 ? "font-bold text-tu-red-600" : undefined}
          >
            {labels?.[i] ?? `Sess ${i + 1}`}
          </span>
        ))}
      </div>
    </div>
  );
}
