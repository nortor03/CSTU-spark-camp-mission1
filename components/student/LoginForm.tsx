"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    // จำลองการยืนยันตัวตน — ภายหลังแทนที่ด้วยการเรียก TU API
    setTimeout(() => router.push(redirectTo), 600);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-bold text-slate-600">
          รหัสนักศึกษา
        </label>
        <input
          inputMode="numeric"
          value={studentId}
          onChange={(e) => setStudentId(onlyDigits(e.target.value).slice(0, 10))}
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base outline-none transition focus:border-tu-red-500 focus:ring-2 focus:ring-tu-red-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-bold text-slate-600">
          รหัสผ่าน
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            inputMode="numeric"
            value={citizenId}
            onChange={(e) =>
              setCitizenId(onlyDigits(e.target.value).slice(0, 13))
            }
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-16 text-base outline-none transition focus:border-tu-red-500 focus:ring-2 focus:ring-tu-red-100"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            {showPassword ? "ซ่อน" : "แสดง"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-tu-red-50 px-3 py-2 text-sm font-medium text-tu-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-tu-red-500 py-3 text-base font-bold text-white transition hover:bg-tu-red-600 disabled:opacity-60"
      >
        {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>

      <p className="text-center text-xs text-slate-400">
        ใช้บัญชีของมหาวิทยาลัยธรรมศาสตร์เท่านั้น
      </p>
    </form>
  );
}
