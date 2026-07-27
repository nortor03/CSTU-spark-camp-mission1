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
    <section className="card flex flex-col p-5 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="display text-xl sm:text-2xl font-bold tracking-tight text-ink-900">กลุ่มทักษะของห้อง</h2>
          <p className="mt-1 text-xs text-ink-500">
            จัดกลุ่มอัตโนมัติจากผลแบบทดสอบรายหัวข้อ
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-ink-700">
          <div className="h-3 w-3 rounded-full border-[3px] border-tu-blue-500 bg-white" aria-hidden />
          ชั้นเรียนปัจจุบัน
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center">
        <SkillRadar axes={radarAxes} />

        <div className="space-y-2">
          {clusters.length === 0 && (
            <p className="text-sm text-ink-400">ยังไม่มีข้อมูลเพียงพอ</p>
          )}
          {clusters.map((c, i) => {
            const colors = [
              "text-tu-blue-600",
              "text-emerald-600",
              "text-tu-red-600",
              "text-tu-gold-700",
            ];
            const titleColor = colors[i % colors.length];

            return (
              <div
                key={c.key}
                className="rounded-xl border border-line-soft bg-paper-50 p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[13px] font-bold ${titleColor}`}>
                    {c.label}
                  </span>
                  <span className="text-[11px] font-medium text-ink-500">
                    {c.count} คน
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-ink-600">
                  {c.weakTopic ? (
                    <>
                      <span className="font-semibold text-ink-800">จุดอ่อน: </span>
                      หัวข้อ “{c.weakTopic}”
                    </>
                  ) : (
                    "ไม่มีจุดอ่อนเด่นชัด"
                  )}
                </p>
              </div>
            );
          })}
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
