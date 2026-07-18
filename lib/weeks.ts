import type { CSSProperties } from "react";

/**
 * ชุดสีป้ายกำกับสัปดาห์
 * เก็บเป็นค่า hex เดียวต่อสี เพื่อให้รองรับได้ทั้ง "สีแนะนำ" (preset)
 * และสีที่ผู้ใช้เลือกเอง (custom) ผ่าน code เส้นเดียวกัน
 */
export interface TagColor {
  key: string;
  label: string;
  hex: string;
}

/** สีแนะนำ — เน้นโทนธรรมศาสตร์ (แดง/ทอง) + สีเสริมอ่านง่าย */
export const TAG_COLORS: TagColor[] = [
  { key: "red", label: "แดงธรรมศาสตร์", hex: "#C8102E" },
  { key: "gold", label: "เหลืองทอง", hex: "#F2A900" },
  { key: "emerald", label: "เขียว", hex: "#10B981" },
  { key: "sky", label: "ฟ้า", hex: "#0EA5E9" },
  { key: "violet", label: "ม่วง", hex: "#8B5CF6" },
];

const FALLBACK_HEX = TAG_COLORS[0].hex;

/** true = ค่านี้เป็นสีที่ผู้ใช้เลือกเอง (เก็บเป็น hex ตรง ๆ) */
export function isCustomColor(colorKey: string | undefined): boolean {
  return !!colorKey && colorKey.startsWith("#");
}

/** แปลง colorKey (คีย์สีแนะนำ หรือค่า hex ของผู้ใช้) → ค่า hex ที่ใช้ render */
export function resolveHex(colorKey: string | undefined): string {
  if (!colorKey) return FALLBACK_HEX;
  if (isCustomColor(colorKey)) return colorKey as string;
  return TAG_COLORS.find((c) => c.key === colorKey)?.hex ?? FALLBACK_HEX;
}

/** ชุด inline-style ที่ derive จากสีฐาน 1 สี */
export interface TagStyles {
  /** ป้าย badge แบบสีทึบ (พื้นเข้ม + ตัวอักษรขาว) */
  solid: CSSProperties;
  /** ป้าย badge แบบสีอ่อน (พื้นจาง + ตัวอักษรเข้ม) */
  soft: CSSProperties;
  /** วงกลมแสดงสี */
  dot: CSSProperties;
}

/** สร้างชุดสไตล์จาก colorKey — ใช้ได้ทั้งสีแนะนำและสีที่ผู้ใช้เลือกเอง */
export function tagStyles(colorKey: string | undefined): TagStyles {
  const hex = resolveHex(colorKey);
  return {
    solid: { backgroundColor: hex, color: "#fff" },
    soft: { backgroundColor: withAlpha(hex, 0.14), color: darken(hex, 0.28) },
    dot: { backgroundColor: hex },
  };
}

/* ---------- ตัวช่วยแปลงสี ---------- */

function parseHex(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [200, 16, 46]; // กันพลาด → แดงธรรมศาสตร์
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** hex → rgba() ตามค่าความโปร่งใสที่กำหนด */
function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** ทำให้สีเข้มขึ้นเพื่อใช้เป็นสีตัวอักษรบนพื้นอ่อน (amount = 0..1) */
function darken(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const f = (v: number) => Math.round(v * (1 - amount));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

/** ตัวเลือกสัปดาห์มาตรฐาน */
export const WEEK_OPTIONS: string[] = Array.from(
  { length: 15 },
  (_, i) => `สัปดาห์ที่ ${i + 1}`,
);

/** ดึงเฉพาะตัวเลขสัปดาห์ออกมาแสดงบนที่คั่น เช่น "สัปดาห์ที่ 3" → "3" */
export function weekNumber(week: string): string {
  const m = week.match(/\d+/);
  return m ? m[0] : "•";
}
