import { TeacherShell } from "@/components/ui/Shells";
import StudentSummary from "@/components/student/StudentSummary";

/**
 * สรุปรายบุคคลของนักศึกษาหนึ่งคน — มุมมองอาจารย์
 * ใช้ shell/breadcrumb ของฝั่งอาจารย์ (ไม่ใช่ /student/summary ของนักศึกษาเอง)
 * เพราะนี่คือการดึงข้อมูลนักศึกษามาแสดงให้อาจารย์ดู ไม่ใช่การ "เข้าไปอยู่ในหน้านักศึกษา"
 */
export default function ReportStudentSummaryPage({
  params,
}: {
  params: { id: string; week: string };
}) {
  const week = `สัปดาห์ที่ ${params.week}`;

  return (
    <TeacherShell>
      <StudentSummary week={week} courseId={params.id} />
    </TeacherShell>
  );
}
