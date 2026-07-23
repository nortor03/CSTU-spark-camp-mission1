import { redirect } from "next/navigation";

export default function Home() {
  // TODO: กลับไปเด้งที่ "/login" ก่อนเสมอ เมื่อต่อ auth จริงแล้ว
  // ปิดไว้ชั่วคราวเพื่อให้ทดสอบ /course ได้ไวขึ้น ไม่ต้อง login ทุกรอบ (login ตอนนี้เป็น mock ล้วน)
  redirect("/course");
}
