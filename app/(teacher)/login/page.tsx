import Brand from "@/components/ui/Brand";
import EmailLoginForm from "@/components/teacher/EmailLoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      {/* ฝั่งซ้าย: รูปตึกโดม มธ. เต็มความสูงจอ (วางไฟล์ที่ public/tu-login.jpg) */}
      <div
        className="relative hidden bg-cream-200 bg-cover bg-center md:block"
        style={{ backgroundImage: "url('/tu-login.jpg')" }}
        aria-hidden
      />

      {/* ฝั่งขวา: ฟอร์มเข้าสู่ระบบ จัดกึ่งกลางแนวตั้ง */}
      <div className="flex items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <Brand size="lg" />
          <p className="mt-8 text-[11px] font-bold uppercase tracking-wider text-tu-red-500">
            สำหรับอาจารย์
          </p>
          <h1 className="mt-0.5 text-3xl font-bold text-slate-800">
            เข้าสู่ระบบ
          </h1>
          <p className="mb-7 mt-2 text-sm text-slate-400">
            กรอกอีเมลและรหัสผ่านเพื่อเริ่มใช้งาน
          </p>
          <EmailLoginForm redirectTo="/course" />
        </div>
      </div>
    </main>
  );
}
