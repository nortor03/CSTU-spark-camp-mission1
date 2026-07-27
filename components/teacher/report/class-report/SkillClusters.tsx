import { useState } from "react";

interface Axis {
  topic: string;
  percent: number;
}
interface Cluster {
  key: string;
  label: string;
  percent: number;
  desc: string;
}
interface ClusterData {
  radarAxes: Axis[];
  clusters: Cluster[];
}

/** โทนสีของแต่ละกลุ่ม (ตามลำดับ ดี → กลาง → ต้องช่วย) — ใช้สีในธีมล้วน */
const CLUSTER_TONE = [
  { dot: "bg-emerald-50 text-emerald-600", title: "text-emerald-700" },
  { dot: "bg-tu-gold-50 text-tu-gold-600", title: "text-tu-gold-700" },
  { dot: "bg-tu-red-50 text-tu-red-600", title: "text-tu-red-700" },
];

/** สีของ % ตามระดับ */
function pctColor(p: number): string {
  if (p >= 80) return "#047857"; // emerald
  if (p >= 50) return "#C4870B"; // gold
  return "#C8102E"; // red
}

export default function SkillClusters({
  isQuizAssigned,
  cloData,
  secondaryData,
}: {
  isQuizAssigned: boolean;
  cloData: ClusterData;
  secondaryData: ClusterData;
}) {
  const [activeTab, setActiveTab] = useState<"clo" | "secondary">("clo");
  const currentData = activeTab === "clo" ? cloData : secondaryData;

  return (
    <section className="card flex flex-col border border-line-soft p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-ink-900">กลุ่มระดับความสำเร็จ</h2>
          <p className="mt-1 text-[13px] font-medium text-ink-500">
            วิเคราะห์และจัดกลุ่มผู้เรียนอัตโนมัติ
          </p>
        </div>
        <div className="flex items-center gap-1 self-start rounded-lg bg-paper-100 p-1 sm:self-auto">
          <button
            onClick={() => setActiveTab("clo")}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${
              activeTab === "clo"
                ? "bg-white text-tu-red-700 shadow-sm"
                : "text-ink-500 hover:text-ink-700"
            }`}
          >
            กลุ่มตาม CLO
          </button>
          <button
            onClick={() => setActiveTab("secondary")}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${
              activeTab === "secondary"
                ? "bg-white text-tu-red-700 shadow-sm"
                : "text-ink-500 hover:text-ink-700"
            }`}
          >
            {isQuizAssigned ? "กลุ่มตามควิซ" : "กลุ่มตามบันทึก"}
          </button>
        </div>
      </div>

      <div className="mt-2 flex w-full flex-col items-center gap-6">
        {/* Radar + legend */}
        <div className="w-full max-w-[320px]">
          <div className="relative flex items-center justify-center rounded-2xl border border-line bg-gradient-to-b from-paper-50 to-white p-3 shadow-sm">
            <SkillRadar axes={currentData.radarAxes} />
          </div>
          {currentData.radarAxes.length >= 3 && (
            <ol className="mt-3 space-y-0.5">
              {currentData.radarAxes.map((a, i) => (
                <li
                  key={a.topic}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-paper-100"
                >
                  <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-tu-red-500 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink-700">
                    {a.topic}
                  </span>
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ color: pctColor(a.percent) }}
                  >
                    {a.percent}%
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Clusters */}
        <div className="flex w-full flex-col gap-5 px-1">
          {currentData.clusters.map((cluster, i) => {
            const tone = CLUSTER_TONE[i] ?? CLUSTER_TONE[2];
            return (
              <div
                key={cluster.key}
                className="group flex items-start gap-4 rounded-xl px-2 py-1 transition-colors hover:bg-paper-100/60"
              >
                <div
                  className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.dot}`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {i === 0 ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    ) : i === 1 ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    )}
                  </svg>
                </div>
                <div className="min-w-0 flex-1 border-b border-line-soft pb-5 group-last:border-0 group-last:pb-0">
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className={`truncate text-base font-bold ${tone.title}`}>
                      {cluster.label}
                    </h3>
                    <div className="flex shrink-0 items-baseline gap-0.5">
                      <span className="text-xl font-bold text-ink-900">
                        {cluster.percent}
                      </span>
                      <span className="text-xs font-semibold text-ink-400">
                        %
                      </span>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed text-ink-500">
                    {cluster.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SkillRadar({ axes }: { axes: Axis[] }) {
  if (axes.length < 3) {
    return (
      <div className="grid place-items-center py-6 text-center text-xs text-ink-400">
        ต้องมีอย่างน้อย 3 หัวข้อ
        <br />
        จึงจะแสดงกราฟเรดาร์ได้
      </div>
    );
  }

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;
  const n = axes.length;
  const angle = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const point = (i: number, rad: number) => {
    const a = angle(i);
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) };
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPath = axes
    .map((a, i) => point(i, (a.percent / 100) * r))
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto w-full max-w-[220px]"
      role="img"
      aria-label="กราฟเรดาร์ความเข้าใจรายหัวข้อของทั้งห้อง (ดูรายละเอียดที่รายการด้านล่าง)"
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

      {/* พื้นที่ข้อมูล — โทนแดงธรรมศาสตร์ */}
      <polygon
        points={dataPath}
        fill="#C8102E"
        fillOpacity={0.12}
        stroke="#C8102E"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* หมุดตัวเลขที่ปลายแกน (แทน label ยาว ๆ ที่อ่านไม่ออก) */}
      {axes.map((a, i) => {
        const tip = point(i, r + 14);
        return (
          <g key={a.topic}>
            <title>{`${a.topic} — ${a.percent}%`}</title>
            <circle cx={tip.x} cy={tip.y} r={9} fill="#C8102E" />
            <text
              x={tip.x}
              y={tip.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
              fontWeight={700}
              fill="#ffffff"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
