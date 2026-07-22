import { TeacherShell } from "@/components/ui/Shells";
import PageHeader from "@/components/ui/PageHeader";
import UploadForm from "@/components/teacher/upload/UploadForm";

/** อัปโหลดสไลด์เพิ่มเติมให้วิชาที่กำลังเปิดอยู่ (ไม่สร้างวิชาใหม่) */
export default function UploadPage() {
  return (
    <TeacherShell>
      <PageHeader
        eyebrow="อัปโหลดสไลด์เพิ่มเติม"
        title="เพิ่มสไลด์เข้าวิชานี้"
      />
      <div className="p-6 sm:p-8">
        <UploadForm mode="slides" />
      </div>
    </TeacherShell>
  );
}
