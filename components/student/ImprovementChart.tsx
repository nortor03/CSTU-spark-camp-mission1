"use client";

import { useId, useMemo, useState } from "react";

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
  const uid = useId();
  const gradientId = `${uid}-grad`;
  const glowId = `${uid}-glow`;
  const shadowId = `${uid}-shadow`;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const height = 190;
  const leftPad = 30;
  const rightPad = 22;
  const topPad = 40;
  const bottomPad = 28;
  const width = 500;

  const getY = (val: number) =>
    height - bottomPad - (val / 100) * (height - topPad - bottomPad);

  const resolvedLabels = useMemo(
    () => scores.map((_, i) => labels?.[i] ?? `Sess ${i + 1}`),
    [scores, labels],
  );

  const { points, linePath, areaPath } = useMemo(() => {
    if (scores.length === 0) return { points: [], linePath: "", areaPath: "" };
    if (scores.length === 1) {
      return {
        points: [{ x: width / 2, y: getY(scores[0]), val: scores[0] }],
        linePath: "",
        areaPath: "",
      };
    }
    const xStep = (width - leftPad - rightPad) / (scores.length - 1);
    const pts = scores.map((s, i) => ({ x: leftPad + i * xStep, y: getY(s), val: s }));

    // เส้นโค้งมนแบบ Catmull-Rom → Bezier (นุ่มกว่าเส้นตรงหักมุม)
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
    }
    const a = `${d} L ${pts[pts.length - 1].x},${height - bottomPad} L ${pts[0].x},${height - bottomPad} Z`;

    return { points: pts, linePath: d, areaPath: a };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores]);

  if (scores.length < 1) {
    return (
      <div className="flex h-[190px] w-full items-center justify-center rounded-lg border border-dashed border-line-soft bg-paper-50 text-sm text-ink-400">
        ยังไม่มีข้อมูลให้แสดงแนวโน้ม
      </div>
    );
  }

  const gridTicks = [0, 50, 100];
  const lastIndex = points.length - 1;
  const shownIndex = activeIndex ?? lastIndex;
  const shownPoint = points[shownIndex];

  // กล่อง tooltip — clamp ไม่ให้ล้นขอบซ้าย/ขวา ลูกศรชี้ตามตำแหน่งจุดจริงเสมอ
  const tw = 66;
  const th = 34;
  const tx = Math.max(2, Math.min(width - tw - 2, shownPoint.x - tw / 2));
  const ty = Math.max(2, shownPoint.y - th - 16);
  const arrowX = Math.max(tx + 12, Math.min(tx + tw - 12, shownPoint.x));

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-paper-50/80 to-transparent p-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-[190px] w-full overflow-visible"
        role="img"
        aria-label={`กราฟแนวโน้มคะแนน ${points.length} จุด ล่าสุด ${resolvedLabels[lastIndex]} ${points[lastIndex].val}%`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#C8102E" stopOpacity={0.32} />
            <stop offset="55%" stopColor="#C8102E" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#C8102E" stopOpacity={0} />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
          <filter id={shadowId} x="-60%" y="-60%" width="220%" height="240%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1C1614" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* grid — เส้นบรรทัดเดียวจางๆ ไม่ประ + ตัวเลขกำกับฝั่งซ้าย */}
        {gridTicks.map((t) => (
          <g key={t}>
            <line
              x1={leftPad}
              x2={width - rightPad}
              y1={getY(t)}
              y2={getY(t)}
              stroke="#F0E8DC"
              strokeWidth={1}
            />
            <text
              x={leftPad - 10}
              y={getY(t)}
              dy={4}
              textAnchor="end"
              className="fill-ink-400 font-medium tabular-nums"
              style={{ fontSize: 11 }}
            >
              {t}
            </text>
          </g>
        ))}

        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} className="chart-fade" />}

        {/* เส้นเรือง (glow) ใต้เส้นหลัก ให้ความรู้สึกพรีเมียม */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#C8102E"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.35}
            filter={`url(#${glowId})`}
          />
        )}

        {linePath && (
          <path
            d={linePath}
            pathLength={1}
            fill="none"
            stroke="#C8102E"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="chart-draw"
          />
        )}

        {/* crosshair ตอน hover/focus */}
        <line
          x1={shownPoint.x}
          x2={shownPoint.x}
          y1={topPad - 14}
          y2={height - bottomPad}
          stroke="#D6C8B4"
          strokeWidth={1}
          strokeDasharray={activeIndex !== null ? undefined : "3 3"}
          opacity={activeIndex !== null ? 1 : 0.5}
        />

        {/* จุด + hit target ใหญ่กว่าจุดจริงสำหรับ hover/focus */}
        <g className="chart-fade-late">
          {points.map((p, i) => {
            const active = i === shownIndex;
            return (
              <g key={i}>
                {active && (
                  <circle cx={p.x} cy={p.y} r={12} fill="#C8102E" opacity={0.16} />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={active ? 7 : 4.5}
                  fill="#C8102E"
                  stroke="#FEFCF8"
                  strokeWidth={2.5}
                  filter={`url(#${shadowId})`}
                  className="transition-[r]"
                />
                {/* hit target ~28px กว้างกว่าจุดจริงมาก กันพลาดตอนเล็งเมาส์ */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={14}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${resolvedLabels[i]}: ${p.val}%`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(i)}
                  onBlur={() => setActiveIndex(null)}
                  className="cursor-pointer outline-none"
                />
              </g>
            );
          })}
        </g>

        {/* tooltip — ค่า + สัปดาห์ของจุดที่กำลังโฟกัส/hover (ดีฟอลต์ = จุดล่าสุด) */}
        <g pointerEvents="none" filter={`url(#${shadowId})`}>
          <rect x={tx} y={ty} width={tw} height={th} rx={10} fill="#2A2320" />
          <polygon
            points={`${arrowX - 5},${ty + th} ${arrowX + 5},${ty + th} ${arrowX},${ty + th + 6}`}
            fill="#2A2320"
          />
          <text
            x={tx + tw / 2}
            y={ty + 15}
            textAnchor="middle"
            className="fill-white font-extrabold tabular-nums"
            style={{ fontSize: 14 }}
          >
            {shownPoint.val}%
          </text>
          <text
            x={tx + tw / 2}
            y={ty + 27}
            textAnchor="middle"
            className="fill-white"
            opacity={0.65}
            style={{ fontSize: 9.5 }}
          >
            {resolvedLabels[shownIndex]}
          </text>
        </g>
      </svg>

      {/* แกน X */}
      <div
        className={`mt-1 flex px-[30px] text-[11px] font-semibold tracking-wide text-ink-400 ${
          scores.length === 1 ? "justify-center" : "justify-between"
        }`}
      >
        {resolvedLabels.map((l, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 ${
              i === shownIndex ? "font-bold text-tu-red-600" : undefined
            }`}
          >
            {i === shownIndex && <span className="h-1.5 w-1.5 rounded-full bg-tu-red-600" />}
            {l}
          </span>
        ))}
      </div>

      {/* ตารางข้อมูลสำรองสำหรับ screen reader — ค่าเดียวกับกราฟเป๊ะ */}
      <table className="sr-only">
        <caption>ข้อมูลกราฟแนวโน้มคะแนนรายจุด</caption>
        <thead>
          <tr><th>ช่วง</th><th>คะแนน</th></tr>
        </thead>
        <tbody>
          {resolvedLabels.map((l, i) => (
            <tr key={i}><td>{l}</td><td>{scores[i]}%</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
