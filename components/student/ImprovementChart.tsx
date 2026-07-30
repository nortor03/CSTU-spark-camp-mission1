"use client";

import { useMemo } from "react";

/**
 * กราฟเส้นโค้งมนสมูท (Smooth Curved Area Line Chart with Badges)
 * แสดงพัฒนาการคะแนนรายสัปดาห์ พร้อมป้ายคะแนน % บนจุดปักและพื้นหลังไล่เฉดสี
 */
export default function ImprovementChart({
  scores,
  labels,
}: {
  scores: number[];
  /** ป้ายกำกับแกน X — ถ้าไม่ส่งจะใช้ "สัปดาห์ 1, 2, …" */
  labels?: string[];
}) {
  const height = 180;
  const paddingX = 36;
  const paddingTop = 36;
  const paddingBottom = 28;
  const width = 600;

  // คำนวณแกน y (0% = ล่างสุด, 100% = บนสุด)
  const getY = (val: number) =>
    height - paddingBottom - ((val / 100) * (height - paddingTop - paddingBottom));

  const { path, points, areaPath } = useMemo(() => {
    if (scores.length < 1) return { path: "", points: [], areaPath: "" };

    const usableWidth = width - paddingX * 2;
    const xStep = scores.length > 1 ? usableWidth / (scores.length - 1) : 0;

    const pts = scores.map((s, i) => ({
      x: scores.length === 1 ? width / 2 : paddingX + i * xStep,
      y: getY(s),
      val: s,
    }));

    if (scores.length === 1) {
      return { path: "", points: pts, areaPath: "" };
    }

    // สร้างเส้นโค้งแบบ Cubic Bezier Smooth Curve
    let linePath = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const pCurrent = pts[i];
      const pNext = pts[i + 1];
      const controlX1 = pCurrent.x + (pNext.x - pCurrent.x) * 0.45;
      const controlY1 = pCurrent.y;
      const controlX2 = pCurrent.x + (pNext.x - pCurrent.x) * 0.55;
      const controlY2 = pNext.y;
      linePath += ` C ${controlX1},${controlY1} ${controlX2},${controlY2} ${pNext.x},${pNext.y}`;
    }

    // สร้างพื้นที่เติมสีใต้เส้น (Gradient Area Path)
    const lastX = pts[pts.length - 1].x;
    const firstX = pts[0].x;
    const bottomY = height - paddingBottom;
    const aPath = `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;

    return { path: linePath, points: pts, areaPath: aPath };
  }, [scores]);

  if (scores.length < 1) {
    return (
      <div className="flex h-[160px] w-full items-center justify-center rounded-2xl border border-dashed border-line-soft bg-paper-50 text-sm text-ink-400">
        ยังไม่มีข้อมูลให้แสดงแนวโน้มพัฒนาการ
      </div>
    );
  }

  // เส้นอ้างอิงเป้าหมาย (0%, 50%, 80%, 100%)
  const gridLevels = [100, 80, 50];

  return (
    <div className="relative w-full rounded-2xl border border-line-soft/80 bg-gradient-to-b from-paper-50/80 to-white p-5 shadow-xs transition-all">
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[180px] w-full overflow-visible"
        >
          <defs>
            {/* Multi-stop Soft Red Gradient Area */}
            <linearGradient id="smoothCurveGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C8102E" stopOpacity={0.22} />
              <stop offset="50%" stopColor="#C8102E" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#C8102E" stopOpacity={0.0} />
            </linearGradient>

            {/* Glowing Stroke Filter */}
            <filter id="glowShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#C8102E" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Grid lines */}
          {gridLevels.map((lvl) => {
            const y = getY(lvl);
            return (
              <g key={lvl}>
                <line
                  x1={paddingX - 10}
                  y1={y}
                  x2={width - paddingX + 10}
                  y2={y}
                  stroke="#E8DFD1"
                  strokeDasharray={lvl === 80 ? "4 4" : "2 2"}
                  strokeWidth={lvl === 80 ? 1.25 : 1}
                  strokeOpacity={0.8}
                />
                <text
                  x={paddingX - 14}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-ink-400 text-[9px] font-bold"
                >
                  {lvl}%
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#smoothCurveGradient)"
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Smooth bezier line */}
          {path && (
            <path
              d={path}
              fill="none"
              stroke="#C8102E"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowShadow)"
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Points & Glow Rings */}
          {points.map((p, i) => {
            const circleFill =
              p.val >= 80 ? "#059669" : p.val >= 50 ? "#D97706" : "#C8102E";

            return (
              <g key={i} className="group">
                {/* Glow ring */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={8}
                  fill={circleFill}
                  fillOpacity={0.2}
                />

                {/* Outer stroke point */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill="#ffffff"
                  stroke={circleFill}
                  strokeWidth={3}
                  className="transition-transform duration-300 group-hover:scale-125"
                />

                {/* Center dot */}
                <circle cx={p.x} cy={p.y} r={2} fill={circleFill} />
              </g>
            );
          })}
        </svg>

        {/* Floating Percentage Badges overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {points.map((p, i) => {
            const pct = p.val;
            const badgeClass =
              pct >= 80
                ? "bg-emerald-500 text-white ring-1 ring-emerald-600/30"
                : pct >= 50
                ? "bg-tu-gold-500 text-white ring-1 ring-tu-gold-600/30"
                : "bg-tu-red-600 text-white ring-1 ring-tu-red-700/30";

            const leftPercent = (p.x / width) * 100;
            const topPercent = (p.y / height) * 100;

            return (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-full pb-3.5 transition-all duration-500"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                }}
              >
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-tight shadow-sm ${badgeClass}`}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* แกน X Label (สัปดาห์) */}
      <div
        className={`mt-1 flex text-[11px] font-bold text-ink-500 ${
          scores.length === 1 ? "justify-center" : "justify-between"
        }`}
        style={{ paddingLeft: `${(paddingX / width) * 100}%`, paddingRight: `${(paddingX / width) * 100}%` }}
      >
        {scores.map((_, i) => (
          <span
            key={i}
            className={`transition-colors ${
              i === scores.length - 1
                ? "text-tu-red-700 font-extrabold"
                : "hover:text-ink-800"
            }`}
          >
            {labels?.[i] ?? `สัปดาห์ ${i + 1}`}
          </span>
        ))}
      </div>
    </div>
  );
}
