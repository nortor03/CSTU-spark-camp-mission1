import AuthLayout from "@/components/ui/AuthLayout";
import EmailLoginForm from "@/components/teacher/EmailLoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="สำหรับอาจารย์"
      title="เข้าสู่ระบบ"
      subtitle="กรอกอีเมลและรหัสผ่านของมหาวิทยาลัยเพื่อเริ่มใช้งาน"
      switchHref="/student/login"
      switchLabel="เป็นนักเรียน? เข้าสู่ระบบที่นี่ →"
    >
      <EmailLoginForm redirectTo="/course" />
    </AuthLayout>
  );
}
