import type { Topic } from "./types";

/**
 * ข้อมูลจำลอง — เสมือน AI วิเคราะห์ไฟล์ PDF แล้วเสนอชื่อหัวข้อมาให้ก่อน
 * ผู้ใช้สามารถแก้ไขชื่อหัวข้อ (title) ทีหลังได้ที่หน้าสรุปหัวข้อ
 */
export const MOCK_AI_TOPICS: Topic[] = [
  {
    id: "t1",
    title: "บทนำสู่การเขียนโปรแกรม",
    file: "intro-programming.pdf",
    selected: false,
    weekAssigned: null,
    aiGenerated: true,
  },
  {
    id: "t2",
    title: "ตัวแปรและชนิดข้อมูล",
    file: "variables-datatypes.pdf",
    selected: false,
    weekAssigned: null,
    aiGenerated: true,
  },
  {
    id: "t3",
    title: "เงื่อนไขและการวนซ้ำ",
    file: "control-flow.pdf",
    selected: false,
    weekAssigned: null,
    aiGenerated: true,
  },
  {
    id: "t4",
    title: "ฟังก์ชันและการนำกลับมาใช้",
    file: "functions.pdf",
    selected: false,
    weekAssigned: null,
    aiGenerated: true,
  },
  {
    id: "t5",
    title: "โครงสร้างข้อมูลเบื้องต้น",
    file: "data-structures.pdf",
    selected: false,
    weekAssigned: null,
    aiGenerated: true,
  },
  {
    id: "t6",
    title: "การจัดการข้อผิดพลาด",
    file: "error-handling.pdf",
    selected: false,
    weekAssigned: null,
    aiGenerated: true,
  },
];
