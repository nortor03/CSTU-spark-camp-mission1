/** หัวข้อการสอน 1 หัวข้อ (topic) */
export interface Topic {
  id: string;
  /** ชื่อหัวข้อ — เริ่มต้นมาจาก AI แล้วผู้ใช้แก้ไขได้ */
  title: string;
  /** ชื่อไฟล์ PDF ต้นทาง */
  file: string;
  /** ถูกเลือกอยู่ในตะกร้าเพื่อจัดกลุ่มหรือไม่ */
  selected: boolean;
  /** สัปดาห์ที่ถูกจัดเข้า (null = ยังไม่จัด) */
  weekAssigned: string | null;
  /** true = ชื่อยังเป็นของ AI, false = ผู้ใช้แก้ไขแล้ว */
  aiGenerated: boolean;
}

/** การตั้งค่าประจำสัปดาห์ (สีป้ายกำกับ) */
export interface WeekConfig {
  /** คีย์สีแนะนำใน TAG_COLORS หรือค่า hex (เช่น "#ff8800") ที่ผู้ใช้เลือกเอง */
  colorKey: string;
}

export type WeekConfigMap = Record<string, WeekConfig>;
