import { TeacherShell } from "@/components/ui/Shells";
import PageHeader from "@/components/ui/PageHeader";
import UploadForm from "@/components/teacher/upload/UploadForm";

export default function UploadPage() {
  return (
    <TeacherShell>
      <PageHeader
        eyebrow="ขั้นตอนที่ 1"
        title="อัปโหลดเอกสารการสอน"
        subtitle="แนบไฟล์ PDF แล้วระบบจะให้ AI ช่วยแยกหัวข้อการสอนให้อัตโนมัติ จากนั้นคุณจึงนำไปจัดเข้าสัปดาห์ได้"
      />
      <div className="card p-6 sm:p-8">
        <UploadForm />
      </div>
    </TeacherShell>
  );
}
