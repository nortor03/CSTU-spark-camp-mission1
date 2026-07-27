/**
 * การ์ด "กลุ่มทักษะของห้อง" — กราฟเรดาร์ค่าเฉลี่ยรายหัวข้อ +
 * กลุ่มนักศึกษาที่จัดอัตโนมัติตามช่วงคะแนน พร้อมจุดอ่อนเด่นของแต่ละกลุ่ม
 * (เทียบกับ "Skill Profile Clusters" ในต้นแบบ)
 */
export default function SkillClusters({
  radarAxes,
  clusters,
}: {
  radarAxes: { topic: string; percent: number }[];
  clusters: {
    key: string;
    label: string;
    count: number;
    weakTopic: string | null;
  }[];
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="display text-lg">กลุ่มทักษะของห้อง</h2>
          <p className="mt-1 text-xs text-ink-500">
            จัดกลุ่มอัตโนมัติจากผลแบบทดสอบรายหัวข้อ
          </p>
        </div>
        <span className="flex flex-shrink-0 items-center gap-1.5 text-[11px] font-medium text-ink-500">
          <span
            className="h-2.5 w-2.5 rounded-full border-2 border-tu-red-500 bg-white"
            aria-hidden
          />
          ค่าเฉลี่ยทั้งห้อง
        </span>
      </div>

      <div className="mt-2 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-center">
        <SkillRadar axes={radarAxes} />

        <div className="space-y-2">
          {clusters.length === 0 && (
            <p className="text-sm text-ink-400">ยังไม่มีข้อมูลเพียงพอ</p>
          )}
          {clusters.map((c) => (
            <div
              key={c.key}
              className="rounded-lg border border-line-soft bg-paper-50 px-3 py-2.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-ink-800">
                  {c.label}
                </span>
                <span className="flex-shrink-0 text-xs font-semibold text-ink-500">
                  {c.count} คน
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">
                {c.weakTopic ? <>จุดอ่อน: หัวข้อ “{c.weakTopic}”</> : "ไม่มีจุดอ่อนเด่นชัด"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** กราฟเรดาร์ความเข้าใจรายหัวข้อของทั้งห้อง (SVG ล้วน ไม่พึ่งไลบรารีภายนอก) */
function SkillRadar({ axes }: { axes: { topic: string; percent: number }[] }) {
  if (axes.length < 3) {
    return (
      <div className="grid place-items-center py-6 text-center text-xs text-ink-400">
        ต้องมีอย่างน้อย 3 หัวข้อ
        <br />
        จึงจะแสดงกราฟเรดาร์ได้
      </div>
    );
  }

  const size = 260;
  const cx = size / 2;
  const cy = size / 2 - 6;
  const r = 86;
  const n = axes.length;
  const angle = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const point = (i: number, rad: number) => {
    const a = angle(i);
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) };
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = axes.map((a, i) => point(i, (a.percent / 100) * r));
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size - 10}`}
      className="mx-auto w-full max-w-[260px]"
      role="img"
      aria-label="กราฟเรดาร์ความเข้าใจรายหัวข้อของทั้งห้อง"
    >
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
      {axes.map((_, i) => {
        const p = point(i, r);
        return (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E8DED0" strokeWidth={1} />
        );
      })}
      <polygon
        points={dataPath}
        fill="#C8102E"
        fillOpacity={0.16}
        stroke="#C8102E"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#fff" stroke="#C8102E" strokeWidth={2} />
      ))}
      {axes.map((a, i) => {
        const p = point(i, r + 20);
        const c = Math.cos(angle(i));
        const anchor = c > 0.35 ? "start" : c < -0.35 ? "end" : "middle";
        return (
          <text
            key={a.topic}
            x={p.x}
            y={p.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-ink-600"
            fontSize={9.5}
            fontWeight={600}
          >
            {a.topic.length > 14 ? `${a.topic.slice(0, 13)}…` : a.topic}
          </text>
        );
      })}
    </svg>
  );
}
