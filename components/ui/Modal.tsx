"use client";

import { useEffect } from "react";

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
  // ปิดด้วยปุ่ม Esc + ล็อกการเลื่อนพื้นหลังขณะเปิด
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink-900/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidth} animate-scale-in overflow-hidden rounded-xl bg-white shadow-lift`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* เส้นทองบนสุดของกล่อง */}
        <div className="h-1 bg-tu-gold-500" aria-hidden />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/** หัวเรื่องใน modal — ใช้ให้เหมือนกันทุกกล่อง */
export function ModalHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      <h3 className="display text-lg">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-ink-500">{subtitle}</p>}
    </div>
  );
}
