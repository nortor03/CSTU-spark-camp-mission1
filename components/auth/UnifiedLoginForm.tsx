"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCourse } from "@/lib/courseStore";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function UnifiedLoginForm() {
  const router = useRouter();
  const { setStudentId } = useCourse();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleVisibility = () => setShowPassword((s) => !s);

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isStudentId = (v: string) => /^\d{10}$/.test(v);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const id = identifier.trim();

    if (isEmail(id)) {
      if (password.length < 6) {
        setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
        return;
      }
      setLoading(true);
      setTimeout(() => router.push("/course"), 600);
      return;
    }

    if (isStudentId(id)) {
      if (!/^\d{13}$/.test(password)) {
        setError("รหัสผ่าน (เลขบัตรประชาชน) ต้องมี 13 หลัก");
        return;
      }
      setLoading(true);
      setStudentId(id);
      setTimeout(() => router.push("/student"), 600);
      return;
    }

    setError("กรอกอีเมล (อาจารย์) หรือรหัสนักศึกษา 10 หลัก (นักเรียน) ให้ถูกต้อง");
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-paper-50 px-4 overflow-hidden">
      {/* Background ambient color accents matching logo */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-tu-red-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-tu-gold-500/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-3 text-center">
          <Image
            src="/tu-logo.png"
            alt="ตราสัญลักษณ์มหาวิทยาลัยธรรมศาสตร์"
            width={96}
            height={96}
            priority
            className="mx-auto h-24 w-24 drop-shadow-sm"
          />
          <div>
            <h1 className="text-balance font-semibold text-3xl text-ink-900">
              เข้าสู่ระบบ
            </h1>
          </div>
        </div>

        <div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="label text-ink-800">
                อีเมล หรือ รหัสนักศึกษา
              </label>
              <div className="relative mt-1.5">
                <input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="field pl-9 border border-line/60 focus:border-tu-red-500/50"
                  autoComplete="username"
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 text-tu-red-500/70">
                  <Mail aria-hidden="true" size={16} />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="label mb-0 text-ink-800">
                  รหัสผ่าน
                </label>
                <a className="text-tu-red-600 text-xs hover:underline font-semibold" href="#">
                  ลืมรหัสผ่าน?
                </a>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="field pl-9 pr-9 border border-line/60 focus:border-tu-red-500/50"
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 text-tu-red-500/70">
                  <Lock aria-hidden="true" size={16} />
                </div>
                <button
                  type="button"
                  onClick={toggleVisibility}
                  className="absolute inset-y-0 right-0 flex h-full w-9 items-center justify-center text-ink-400 hover:text-tu-red-600 transition"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={16} />
                  ) : (
                    <Eye aria-hidden="true" size={16} />
                  )}
                </button>
              </div>
            </div>

            {error && <p className="alert-error text-xs py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full gap-2 py-3 shadow-md shadow-tu-red-500/20"
            >
              {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
