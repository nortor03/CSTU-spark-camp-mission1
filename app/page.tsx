import { redirect } from "next/navigation";

export default function Home() {
  // เข้าหน้าแรกให้เด้งไปหน้า login ก่อนเสมอ
  redirect("/login");
}
