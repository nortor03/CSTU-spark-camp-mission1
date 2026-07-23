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
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [shakeIdentifier, setShakeIdentifier] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleVisibility = () => setShowPassword((s) => !s);

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isStudentId = (v: string) => /^\d{10}$/.test(v);

  function triggerShakeIdentifier() {
    setShakeIdentifier(true);
    setTimeout(() => setShakeIdentifier(false), 500);
  }

  function triggerShakePassword() {
    setShakePassword(true);
    setTimeout(() => setShakePassword(false), 500);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIdentifierError("");
    setPasswordError("");
    const id = identifier.trim();

    // ดึงค่าบัญชีและรหัสผ่านเข้าสู่ระบบจาก environment variables
    const envTeacherEmail = process.env.NEXT_PUBLIC_TEACHER_EMAIL;
    const envTeacherPassword = process.env.NEXT_PUBLIC_TEACHER_PASSWORD;
    const envStudentId = process.env.NEXT_PUBLIC_STUDENT_ID;
    const envStudentPassword = process.env.NEXT_PUBLIC_STUDENT_PASSWORD;

    // --- ตรวจสอบฝั่งอาจารย์ (อีเมล) ---
    const isTeacherRole = (envTeacherEmail && id === envTeacherEmail) || isEmail(id);
    if (isTeacherRole) {
      const isValidPassword = envTeacherPassword
        ? password === envTeacherPassword
        : password.length >= 6;

      if (!isValidPassword) {
        setPasswordError("รหัสไม่ถูกต้อง");
        triggerShakePassword();
        return;
      }

      setLoading(true);
      setTimeout(() => router.push("/course"), 600);
      return;
    }

    // --- ตรวจสอบฝั่งนักเรียน (รหัสนักศึกษา) ---
    const isStudentRole = (envStudentId && id === envStudentId) || isStudentId(id);
    if (isStudentRole) {
      const isValidPassword = envStudentPassword
        ? password === envStudentPassword
        : /^\d{13}$/.test(password);

      if (!isValidPassword) {
        setPasswordError("รหัสไม่ถูกต้อง");
        triggerShakePassword();
        return;
      }

      setLoading(true);
      setStudentId(id);
      setTimeout(() => router.push("/student"), 600);
      return;
    }

    setIdentifierError("กรอกอีเมลหรือรหัสนักศึกษาให้ถูกต้อง");
    triggerShakeIdentifier();
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-paper-50 px-4 overflow-hidden">
      {/* Background ambient color accents matching logo */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-tu-red-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-tu-gold-500/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-sm space-y-6 rounded-2xl border border-line-strong/50 bg-white/40 p-6 sm:p-8 backdrop-blur-[2px]">
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
              เข้าสู่ระบบ Tonlabkit
            </h1>
            <p className="mt-1.5 text-xs text-ink-500">
              ยินดีต้อนรับ! กรุณากรอกข้อมูลของคุณเพื่อเข้าสู่ระบบ
            </p>
          </div>
        </div>

        <div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="label text-ink-800">
                อีเมล หรือ รหัสนักศึกษา
              </label>
              <div className={`relative mt-1.5 ${shakeIdentifier ? "animate-shake" : ""}`}>
                <input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (identifierError) setIdentifierError("");
                  }}
                  className={`field pl-9 border transition ${
                    identifierError
                      ? "border-tu-red-500 bg-tu-red-50/50 focus:border-tu-red-500"
                      : "border-line/60 focus:border-tu-red-500/50"
                  }`}
                  autoComplete="username"
                />
                <div
                  className={`pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 ${
                    identifierError ? "text-tu-red-500" : "text-tu-red-500/70"
                  }`}
                >
                  <Mail aria-hidden="true" size={16} />
                </div>
              </div>
              {identifierError && (
                <p className="mt-1.5 text-xs font-medium text-tu-red-600">
                  {identifierError}
                </p>
              )}
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
              <div className={`relative mt-1.5 ${shakePassword ? "animate-shake" : ""}`}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  className={`field pl-9 pr-9 border transition ${
                    passwordError
                      ? "border-tu-red-500 bg-tu-red-50/50 focus:border-tu-red-500"
                      : "border-line/60 focus:border-tu-red-500/50"
                  }`}
                  autoComplete="current-password"
                />
                <div
                  className={`pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 ${
                    passwordError ? "text-tu-red-500" : "text-tu-red-500/70"
                  }`}
                >
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
              {passwordError && (
                <p className="mt-1.5 text-xs font-medium text-tu-red-600">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-line/80 text-tu-red-600 focus:ring-tu-red-500/30 accent-tu-red-600 cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-xs text-ink-700 font-medium cursor-pointer select-none">
                จดจำการเข้าสู่ระบบ
              </label>
            </div>

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
