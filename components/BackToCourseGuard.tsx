"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";

const SUMMARY_PREFIX = "/student/summary";

/**
 * กด back ของ browser จากหน้าภาพรวม/วิเคราะห์ผลการเรียนรู้ (ไม่ว่าจะสัปดาห์ไหน หรือแวะผ่านมากี่หน้า)
 * ให้กลับไปหน้ารายละเอียดวิชาเสมอ — mount ครั้งเดียวใน root layout เพราะ popstate listener
 * ที่ผูกไว้ในหน้า page เองจะถูก React ถอด (unmount) ระหว่างที่ Next.js กำลังจัดการ popstate event
 * เดียวกันอยู่พอดี ทำให้ listener ไม่ทำงานเลย ต้องผูกไว้ที่ component ที่ไม่มีวัน unmount แทน
 *
 * การเรียก router.replace ต้อง defer ด้วย setTimeout เพราะ Next.js เองก็จัดการ popstate นี้แบบ
 * async อยู่แล้ว (restore ไปหน้าก่อนหน้าจริง ๆ) ถ้า replace แบบ sync จะโดน navigation ของ Next.js
 * แซงทับ ต้องปล่อยให้ Next.js จัดการเสร็จก่อนแล้วค่อย replace ทับอีกที
 */
export default function BackToCourseGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeCourseId } = useCourse();

  const fallbackRef = useRef<string | null>(null);
  useEffect(() => {
    fallbackRef.current =
      pathname.startsWith(SUMMARY_PREFIX) && activeCourseId
        ? `/student/course/${activeCourseId}`
        : null;
  }, [pathname, activeCourseId]);

  useEffect(() => {
    const handlePopState = () => {
      const fallback = fallbackRef.current;
      if (fallback) setTimeout(() => router.replace(fallback), 0);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  return null;
}
