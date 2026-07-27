import { redirect } from "next/navigation";

export default function RedirectToWeek1() {
  redirect("/student/summary/1");
}
