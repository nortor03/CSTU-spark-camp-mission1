import Brand from "@/components/ui/Brand";
import UploadForm from "@/components/teacher/upload/UploadForm";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-cream-100 p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <Brand />
        </header>

        <div className="rounded-3xl border border-slate-100 bg-white p-8">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h1 className="text-2xl font-bold text-slate-800">
              อัปโหลดเอกสารการสอน
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              แนบไฟล์ PDF แล้วระบบจะให้ AI ช่วยแยกหัวข้อการสอนให้อัตโนมัติ
            </p>
          </div>

          <UploadForm />
        </div>
      </div>
    </main>
  );
}
