"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * ฟอร์มเข้าสู่ระบบด้วยอีเมล + รหัสผ่าน (สำหรับอาจารย์, mock)
 * - ยังไม่ต่อระบบ auth จริง — validate เบื้องต้นแล้ว redirect
 */
export default function EmailLoginForm({
  redirectTo = "/course",
}: {
  redirectTo?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    // จำลองการยืนยันตัวตน — ภายหลังแทนที่ด้วยระบบ auth จริง
    setTimeout(() => router.push(redirectTo), 600);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-bold text-slate-600">
          อีเมล
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
