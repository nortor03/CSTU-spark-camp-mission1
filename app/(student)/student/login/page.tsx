import AuthLayout from "@/components/ui/AuthLayout";
import LoginForm from "@/components/student/LoginForm";

export default function StudentLoginPage() {
  return (
    <AuthLayout
      eyebrow="สำหรับนักเรียน"
      title="เข้าทำแบบทดสอบ"
      subtitle="กรอกรหัสนักศึกษาและเลขบัตรประชาชนเพื่อเข้าทำแบบทดสอบรายสัปดาห์"
      switchHref="/login"
      switchLabel="เป็นอาจารย์? เข้าสู่ระบบที่นี่ →"
    >
      <LoginForm redirectTo="/student" />
    </AuthLayout>
  );
}
