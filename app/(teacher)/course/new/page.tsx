import { TeacherShell } from "@/components/ui/Shells";
import PageHeader from "@/components/ui/PageHeader";
import UploadForm from "@/components/teacher/upload/UploadForm";

/** สร้างรายวิชาใหม่ (ชื่อวิชา + สไลด์ + syllabus) */
export default function NewCoursePage() {
  return (
    <TeacherShell>
      <PageHeader
        eyebrow="อัปโหลดสไลด์และสร้างวิชา"
        title="สร้างวิชาใหม่"
      />
      <div className="card p-6 sm:p-8">
        <UploadForm mode="new" />
      </div>
    </TeacherShell>
  );
}
