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
        <label className="label">อีเมล</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@dome.tu.ac.th"
          className="field"
        />
      </div>

      <div>
        <label className="label">รหัสผ่าน</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field pr-16"
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
