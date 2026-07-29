/**
 * ชุด Skeleton loading — ใช้แทนข้อความ "กำลังโหลด…" เดิม
 * แต่ละตัวจำลองรูปทรงคร่าว ๆ ของหน้าจริงหลังโหลดเสร็จ ลดอาการฟ้าจอ/กระพริบ
 */

/** แถบพื้นฐาน — ใช้ประกอบเป็นชิ้นอื่น ๆ ได้ */
export function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden />;
}

/** จำลอง PageHeader (ป้ายหมวด + หัวเรื่อง + เส้นทอง + ปุ่มมุมขวา) */
export function SkeletonHeader({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <SkeletonBar className="h-3 w-28" />
        <SkeletonBar className="mt-2.5 h-8 w-64 max-w-full" />
        <div className="my-3 h-px w-16 bg-line-soft" />
      </div>
      {withAction && <SkeletonBar className="h-9 w-32 flex-shrink-0 rounded-xl" />}
    </div>
  );
}

/** จำลองการ์ดรายวิชา (โค้ด + ชื่อวิชา + ชิปสถิติ 2 ช่อง + ปุ่ม) — ใช้กับหน้ารายการวิชา/รายงาน */
export function SkeletonCardGrid({
  count = 6,
  withHeader = true,
  headerAction = false,
  withAction = true,
}: {
  count?: number;
  withHeader?: boolean;
  /** ปุ่มมุมขวาบนของ PageHeader เอง (เช่น "+ เพิ่มรายวิชาใหม่") — ต่างจาก withAction ที่เป็นปุ่ม CTA ในการ์ดแต่ละใบ */
  headerAction?: boolean;
  withAction?: boolean;
}) {
  return (
    <div>
      {withHeader && <SkeletonHeader withAction={headerAction} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-white p-5">
            <SkeletonBar className="h-3 w-16" />
            <SkeletonBar className="mt-2.5 h-5 w-4/5" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <SkeletonBar className="h-12 rounded-xl" />
              <SkeletonBar className="h-12 rounded-xl" />
            </div>
            {withAction && <SkeletonBar className="mt-4 h-10 w-full rounded-xl" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/** จำลองรายการแถวคั่นเส้น (สัปดาห์/ผลสรุป) — การ์ด divide-y แถบสี + ตัวเลข + ข้อความ 2 บรรทัด + ปุ่ม/ลิงก์ */
export function SkeletonListRows({
  rows = 5,
  withHeader = true,
}: {
  rows?: number;
  withHeader?: boolean;
}) {
  return (
    <div>
      {withHeader && <SkeletonHeader />}
      <div className="card divide-y divide-line-soft border border-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <SkeletonBar className="h-10 w-1.5 flex-shrink-0 rounded-full" />
            <SkeletonBar className="h-9 w-9 flex-shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBar className="h-4 w-2/3 max-w-xs" />
              <SkeletonBar className="h-3 w-1/3 max-w-[10rem]" />
            </div>
            <SkeletonBar className="h-8 w-20 flex-shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** จำลองหน้าสรุปรายบุคคล — วงแหวนคะแนน + สถิติข้าง ๆ ตามด้วยบล็อกเนื้อหา */
export function SkeletonStatHero() {
  return (
    <div>
      <SkeletonBar className="mb-4 h-3 w-40" />
      <section className="flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-16">
        <SkeletonBar className="h-[170px] w-[170px] flex-shrink-0 rounded-full" />
        <div className="w-full flex-1 space-y-4">
          <SkeletonBar className="h-6 w-2/3 max-w-sm" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonBar className="h-3 w-16" />
                <SkeletonBar className="h-6 w-12" />
              </div>
            ))}
          </div>
          <SkeletonBar className="h-40 w-full rounded-2xl" />
        </div>
      </section>
      <div className="mt-10 grid gap-6 border-t border-line-soft pt-10 lg:grid-cols-2">
        <SkeletonBar className="h-56 w-full rounded-2xl" />
        <SkeletonBar className="h-56 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** จำลองหน้ารายงานชั้นเรียน — แถว KPI 4 ช่อง แล้วตามด้วยการ์ด 2 คอลัมน์ */
export function SkeletonKpiSection() {
  return (
    <div>
      <SkeletonHeader />
      <div className="mb-7 grid grid-cols-2 gap-x-10 gap-y-6 border-b border-line-soft pb-7 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonBar className="h-72 w-full rounded-2xl" />
        <SkeletonBar className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}
