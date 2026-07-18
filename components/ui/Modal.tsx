"use client";

/** กรอบ modal กลางจอ พร้อมพื้นหลังเบลอ ใช้ซ้ำได้ */
export default function Modal({
  open,
  onClose,
  children,
  maxWidth = "max-w-sm",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} animate-scale-in rounded-2xl bg-white p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
