"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";

/**
 * ฟอร์มเข้าสู่ระบบ (mock)
 * - ใช้รหัสนักศึกษา + เลขบัตรประชาชนเป็นรหัสผ่าน
 * - ยังไม่ต่อ TU API จริง (ต้องขอสิทธิ์ก่อน) — validate เบื้องต้นแล้วเข้าหน้า upload
 */
export default function LoginForm({
  redirectTo = "/course",
}: {
  /** ปลายทางหลัง login สำเร็จ (ครู = /course, นักเรียน = /student) */
  redirectTo?: string;
}) {
  const router = useRouter();
  const { setStudentId: rememberStudentId } = useCourse();
  const [studentId, setStudentId] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onlyDigits = (v: string) => v.replace(/\D/g, "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (studentId.length < 10) {
      setError("กรุณากรอกรหัสนักศึกษาให้ครบ 10 หลัก");
      return;
    }
    if (citizenId.length !== 13) {
      setError("เลขบัตรประชาชนต้องมี 13 หลัก");
      return;
    }

    setLoading(true);
    // จำรหัสนักศึกษาไว้ใช้ผูกกับผลการทำแบบทดสอบ
    rememberStudentId(studentId);
    // จำลองการยืนยันตัวตน — ภายหลังแทนที่ด้วยการเรียก TU API
    setTimeout(() => router.push(redirectTo), 600);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">รหัสนักศึกษา</label>
        <input
          inputMode="numeric"
          value={studentId}
          onChange={(e) => setStudentId(onlyDigits(e.target.value).slice(0, 10))}
          placeholder="10 หลัก"
          className="field tracking-wider"
        />
      </div>

      <div>
        <label className="label">รหัสผ่าน (เลขบัตรประชาชน)</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            inputMode="numeric"
            value={citizenId}
            onChange={(e) =>
              setCitizenId(onlyDigits(e.target.value).slice(0, 13))
            }
            className="field pr-16 tracking-wider"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-ink-400 transition hover:bg-paper-200 hover:text-ink-700"
          >
            {showPassword ? "ซ่อน" : "แสดง"}
          </button>
        </div>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>

      <p className="text-center text-xs text-ink-400">
        ใช้บัญชีของมหาวิทยาลัยธรรมศาสตร์เท่านั้น
      </p>
    </form>
  );
}
