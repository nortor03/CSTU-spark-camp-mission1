"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Send, X, ClipboardList } from "lucide-react";

/**
 * ผู้ช่วยจัดการรายวิชาฝั่งอาจารย์ — side panel สไตล์ "Claude in Chrome"
 * (คู่กับ StudentAssistant ฝั่งนักเรียน) mount ใน TeacherShell → ขึ้นทุกหน้า
 * รวมความสามารถของ QuizChat เดิม (ช่วยออกแบบคำถาม) ไว้เป็น quick action
 * ตอนนี้ยังเป็น mock (ยังไม่ต่อ AI จริง)
 */

interface Msg {
  id: string;
  sender: "bot" | "user";
  text: string;
}

const SUGGESTIONS = [
  "ช่วยออกแบบคำถาม",
  "สรุปผลชั้นเรียน",
  "หัวข้อที่นักศึกษายังอ่อน",
  "ปรับระดับคำถามให้ยากขึ้น",
];

/** context สั้น ๆ จาก path ปัจจุบัน */
function contextLabel(pathname: string): string {
  const wk = pathname.match(/\/quiz\/(\d+)/)?.[1];
  if (wk) return `กำลังสร้างควิซ · สัปดาห์ที่ ${wk}`;
  if (pathname.startsWith("/report")) return "กำลังดูรายงานชั้นเรียน";
  if (pathname.startsWith("/topics")) return "กำลังจัดหัวข้อ";
  if (pathname.startsWith("/course")) return "กำลังดูรายวิชา";
  return "พร้อมช่วยจัดการรายวิชา";
}

/** คำตอบจำลอง — ปรับตามข้อความ */
function mockReply(text: string): string {
  if (text.includes("ออกแบบคำถาม") || text.includes("เพิ่มคำถาม")) {
    return 'ได้เลย! นี่คือตัวอย่างคำถามปรนัย:\n\n"ข้อใดคือเป้าหมายหลักของการเขียนโปรแกรม?"\nก. ออกแบบรูปภาพ\nข. แก้ปัญหาอย่างมีลำดับขั้นตอน\nค. ติดตั้งระบบปฏิบัติการ\nง. จัดการฐานข้อมูล\n(เฉลย: ข.)\n\nอยากให้ปรับหัวข้อ/ระดับความยากเพิ่มบอกได้เลย';
  }
  if (text.includes("ยาก") || text.includes("ระดับ")) {
    return "เพื่อเพิ่มความท้าทาย ลองปรับเป็นคำถามคิดวิเคราะห์ (เช่น หาผลลัพธ์ของลูป) หรือให้หาจุดผิด (bug) ในชุดคำสั่ง แทนการถามนิยามตรง ๆ";
  }
  if (text.includes("สรุปผล") || text.includes("ชั้นเรียน")) {
    return "ภาพรวมชั้นเรียน (ตัวอย่าง): ค่าเฉลี่ย 68% · ผ่านเกณฑ์ 74% ของนักศึกษา · หัวข้อที่คะแนนต่ำสุดคือ “เงื่อนไขและการวนซ้ำ” — แนะนำให้ทบทวนซ้ำในคาบถัดไป";
  }
  if (text.includes("อ่อน") || text.includes("หัวข้อ")) {
    return "หัวข้อที่นักศึกษายังอ่อน (ตัวอย่าง): 1) การวนซ้ำซ้อน 2) ขอบเขตตัวแปรในฟังก์ชัน 3) การจัดการข้อผิดพลาด — อยากให้ช่วยออกโจทย์เสริมหัวข้อไหนบอกได้เลย";
  }
  return "รับทราบ! ช่วยได้ทั้งออกแบบคำถาม สรุปผลชั้นเรียน หรือแนะนำหัวข้อที่ควรเน้น — บอกได้เลยว่าจะให้ช่วยเรื่องไหน";
}

export default function TeacherAssistant() {
  const pathname = usePathname();
  const ctx = contextLabel(pathname);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "สวัสดีอาจารย์! ผมเป็นผู้ช่วยจัดการรายวิชา 🤖 ช่วยออกแบบคำถาม สรุปผลชั้นเรียน หรือแนะนำหัวข้อที่ควรเน้นได้เลย",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Msg = { id: Date.now().toString(), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-bot`, sender: "bot", text: mockReply(text) },
      ]);
    }, 900);
  }

  return (
    <>
      {/* ปุ่มเรียกผู้ช่วย */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-tu-red-500 py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-lift transition hover:bg-tu-red-600 active:scale-95"
        >
          <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
          ผู้ช่วย AI
        </button>
      )}

      {/* backdrop เฉพาะจอเล็ก */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-[1px] sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* side panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-line bg-paper-50 shadow-lift transition-transform duration-300 ease-out sm:w-[400px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-tu-red-50 text-tu-red-600">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink-900">ผู้ช่วยจัดการรายวิชา</p>
              <p className="truncate text-[11px] text-ink-400">{ctx}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-200 hover:text-ink-700"
            aria-label="ปิดผู้ช่วย"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4"
        >
          {messages.map((m) => {
            const isBot = m.sender === "bot";
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${isBot ? "" : "flex-row-reverse"}`}
              >
                {isBot ? (
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border border-tu-red-100 bg-tu-red-50 text-tu-red-600">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-tu-gold-500 text-[11px] font-bold text-white">
                    อ.
                  </span>
                )}
                <div
                  className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    isBot
                      ? "rounded-tl-sm border border-line-soft bg-white text-ink-700"
                      : "rounded-tr-sm bg-tu-red-500 text-white"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="flex items-start gap-2.5">
              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border border-tu-red-100 bg-tu-red-50 text-tu-red-600">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-line-soft bg-white px-3.5 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:0.3s]" />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-line-soft bg-paper-100/60 px-3 py-2.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink-600 transition hover:border-tu-red-200 hover:bg-tu-red-50 hover:text-tu-red-600"
            >
              <ClipboardList className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-line bg-white p-3"
        >
          <div className="flex items-center gap-2 rounded-2xl bg-paper-100 px-3.5 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ถามหรือสั่งงานผู้ช่วย…"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-800 outline-none placeholder:text-ink-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex-shrink-0 text-tu-red-500 transition hover:text-tu-red-600 disabled:opacity-30"
              aria-label="ส่งข้อความ"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
