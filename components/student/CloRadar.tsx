"use client";

import { useMemo } from "react";
import type { SyllabusClo } from "@/lib/syllabus";
import type { Quiz } from "@/lib/quiz";
import type { StudentAnswers } from "@/lib/feedback";


export interface CloMastery {
  code: string;
  description: string;
  correct: number;
  total: number;
  percent: number;
}

/**
 * คำนวณ mastery ของแต่ละ CLO จากคำตอบของนักเรียน
 * ใช้ `QuizQuestion.relatedClos` จับคู่กับ `course.clos`
 */
export function buildCloMastery(
  quizzes: Quiz[],
  answersList: StudentAnswers[],
  clos: SyllabusClo[],
): CloMastery[] {
  if (clos.length === 0) return [];

  const map = new Map<string, { correct: number; total: number }>();
  for (const clo of clos) {
    map.set(clo.code, { correct: 0, total: 0 });
  }

  for (let qi = 0; qi < quizzes.length; qi++) {
    const quiz = quizzes[qi];
    const answers = answersList[qi] ?? {};
    for (const q of quiz.questions) {
      const codes = q.relatedClos ?? [];
      for (const code of codes) {
        if (!map.has(code)) continue;
        const cur = map.get(code)!;
        cur.total += 1;
        if (answers[q.id] === q.answer) cur.correct += 1;
      }
    }
  }

  return clos
    .map((clo) => {
      const { correct, total } = map.get(clo.code) ?? { correct: 0, total: 0 };
      const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        code: clo.code,
        description: clo.description ?? clo.code,
        correct,
        total,
        percent,
      };
    })
    .filter((c) => c.total > 0); // แสดงเฉพาะ CLO ที่มีคำถาม
}

/* ─── CLO Radar Chart SVG ─── */
export default function CloRadar({ clos }: { clos: CloMastery[] }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.33;

  if (clos.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-ink-400">
        ยังไม่มีข้อมูล CLO — ข้อสอบในวิชานี้ยังไม่ได้ระบุ CLO ที่เกี่ยวข้อง
      </div>
    );
  }

  const { axes, dataPath, dataPts } = useMemo(() => {
    const active = clos.slice(0, 8); // จำกัด 8 CLO
    const count = active.length;

    const axes = active.map((clo, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      return {
        code: clo.code,
        label: clo.description.length > 30 ? clo.code : clo.description,
        shortLabel: clo.code,
        px: cx + Math.cos(angle) * (r + 22),
        py: cy + Math.sin(angle) * (r + 22),
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        percent: clo.percent,
      };
    });

    const dataPts = active.map((clo, i) => {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const dist = r * (clo.percent / 100);
      return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist };
    });

    const dataPath =
      dataPts.length > 0
        ? dataPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"
        : "";

    return { axes, dataPath, dataPts };
  }, [clos, cx, cy, r]);

  // กริดวง 4 ระดับ
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  function gridPath(scale: number): string {
    const count = axes.length;
    return axes
      .map((_, i) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        const x = cx + Math.cos(angle) * r * scale;
        const y = cy + Math.sin(angle) * r * scale;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ") + " Z";
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px]">
      <defs>
        <radialGradient id="clo-radar-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C8102E" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#C8102E" stopOpacity="0.08" />
        </radialGradient>
      </defs>

      {/* Grid polygons */}
      {gridLevels.map((scale, i) => (
        <path
          key={i}
          d={gridPath(scale)}
          fill="none"
          stroke="#E2D8CC"
          strokeWidth={scale === 1.0 ? 1.2 : 0.8}
          opacity={scale === 1.0 ? 0.7 : 0.5}
        />
      ))}

      {/* Radial lines */}
      {axes.map((ax, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={ax.x}
          y2={ax.y}
          stroke="#D6C8B4"
          strokeWidth={0.8}
          opacity={0.6}
        />
      ))}

      {/* Data polygon */}
      {dataPath && (
        <>
          <path d={dataPath} fill="url(#clo-radar-fill)" stroke="#C8102E" strokeWidth={2} />
          {dataPts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="white" stroke="#C8102E" strokeWidth={1.8} />
          ))}
        </>
      )}

      {/* Labels */}
      {axes.map((ax, i) => (
        <text
          key={i}
          x={ax.px}
          y={ax.py}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fontWeight={700}
          fill="#7A6A5A"
          style={{ fontFamily: "inherit" }}
        >
          {ax.shortLabel}
        </text>
      ))}
    </svg>
  );
}
