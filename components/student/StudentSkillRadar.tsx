"use client";

import { useMemo } from "react";
import type { TopicMastery } from "@/lib/analytics";

/** กราฟเรดาร์แสดงจุดแข็ง/จุดอ่อนของนักเรียนรายบุคคล */
export default function StudentSkillRadar({
  topics,
}: {
  topics: TopicMastery[];
}) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35; // รัศมีวงนอก

  // ถ้าไม่มีหัวข้อเลย คืนค่าเป็นกราฟเปล่า
  if (topics.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-sm text-ink-400">
        ยังไม่มีข้อมูลเพียงพอ
      </div>
    );
  }

  const { axes, dataPath, dataPts } = useMemo(() => {
    // จำกัดจำนวนเพื่อไม่ให้กราฟดูรกเกินไป
    const active = topics.slice(0, 6);
    const count = active.length;
    
    // คำนวณมุม (หมุนชี้บน)
    const angle = (i: number) => (Math.PI * 2 * i) / count - Math.PI / 2;
    // คำนวณพิกัดจากมุมและระยะ (d = distance จากจุดศูนย์กลาง 0 ถึง 1)
    const point = (i: number, dist: number) => {
      const a = angle(i);
      return { x: cx + Math.cos(a) * dist, y: cy + Math.sin(a) * dist };
    };

    const axesData = active.map((t, i) => {
      // 0-100% → 0.0-1.0
      // ให้คะแนนต่ำสุดอยู่ที่ 0.1 จะได้ไม่รวบกันตรงกลาง
      const pct = t.percent === 0 ? 0.1 : t.percent / 100;
      return {
        topic: t.topic,
        percent: t.percent,
        val: pct,
        pt: point(i, r * pct),
      };
    });

    const dPath =
      axesData.map((d, i) => `${i === 0 ? "M" : "L"} ${d.pt.x},${d.pt.y}`).join(" ") + " Z";

    return { axes: axesData, dataPath: dPath, dataPts: axesData.map((d) => d.pt) };
  }, [topics, cx, cy, r]);

  // วงแหวน (0.2, 0.4, 0.6, 0.8, 1.0)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
  
  // แกนรัศมี
  const angle = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2;
  const point = (i: number, dist: number) => {
    const a = angle(i);
    return { x: cx + Math.cos(a) * dist, y: cy + Math.sin(a) * dist };
  };

  function shortLabel(topic: string) {
    return topic.length > 20 ? topic.substring(0, 18) + "..." : topic;
  }

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full overflow-visible"
        role="img"
        aria-label="กราฟเรดาร์แสดงจุดแข็งและจุดอ่อน"
      >
        {/* วงแหวน */}
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={axes
              .map((_, i) => point(i, r * ring))
              .map((p) => `${p.x},${p.y}`)
              .join(" ")}
            fill="none"
            stroke="#E8DED0"
            strokeWidth={1}
          />
        ))}
        {/* แกน */}
        {axes.map((_, i) => {
          const p = point(i, r);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#E8DED0"
              strokeWidth={1}
            />
          );
        })}

        {/* พื้นที่ข้อมูล (ใช้สีแดงธรรมศาสตร์) */}
        <g className="radar-pop">
          <polygon
            points={dataPath}
            fill="#C8102E"
            fillOpacity={0.15}
            stroke="#C8102E"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {dataPts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#C8102E" />
          ))}
        </g>

        {/* ป้ายชื่อรอบแกน */}
        {axes.map((a, i) => {
          const tip = point(i, r + 16);
          const c = Math.cos(angle(i));
          const anchor = c > 0.35 ? "start" : c < -0.35 ? "end" : "middle";
          return (
            <g key={a.topic}>
              <title>{`${a.topic} — ${a.percent}%`}</title>
              <text
                x={tip.x}
                y={tip.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fill="#374151"
                fontSize={11}
                fontWeight={700}
                className="cursor-help"
              >
                {shortLabel(a.topic)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
