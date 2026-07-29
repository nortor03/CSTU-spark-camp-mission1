"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Send, X, ClipboardList } from "lucide-react";

/**
 * ผู้ช่วยทบทวนฝั่งนักศึกษา — side panel สไตล์ "Claude in Chrome"
 * - เลื่อนออกมาจากขวา อยู่ข้างเนื้อหา (บนจอใหญ่ไม่บังทั้งจอ)
 * - รู้ว่ากำลังอยู่สัปดาห์ไหน (อ่านจาก path) เพื่อตอบให้ตรงบริบท
 * - ตอนนี้ยังเป็น mock (ยังไม่ต่อ AI จริง) — ตอบจากชุดคำตอบตัวอย่าง
 */

interface Msg {
  id: string;
  sender: "bot" | "user";
  text: string;
}

/** คำตอบจำลอง — ปรับตามข้อความ + สัปดาห์ที่กำลังดู */
function mockReply(text: string, weekLabel: string | null): string {
  const wk = weekLabel ?? "สัปดาห์นี้";

  // 1. ถามหาหัวข้อทั้งหมดของวิชา
  if (
    text.includes("หัวข้อของรายวิชา") ||
    text.includes("หัวข้อทั้งหมด") ||
    (text.includes("หัวข้อ") && text.includes("วิชา")) ||
    (text.includes("บทเรียน") && text.includes("อะไรบ้าง"))
  ) {
    return `รายวิชานี้มีหัวข้อหลัก ๆ ดังนี้ครับ:\n\n` +
      `• สัปดาห์ที่ 1: ตัวแปร ชนิดข้อมูล และนิพจน์ (Variables, Data Types and Expressions)\n` +
      `• สัปดาห์ที่ 2: โครงสร้างควบคุมแบบเงื่อนไขและการวนซ้ำ (Control Structures & Loops)\n` +
      `• สัปดาห์ที่ 3: ฟังก์ชันและขอบเขตตัวแปร (Functions & Variable Scope)\n` +
      `• สัปดาห์ที่ 4: โครงสร้างข้อมูล อาเรย์ 1 มิติ (1D Arrays)\n\n` +
      `ต้องการให้ผมสรุป อธิบายเนื้อหา หรือออกโจทย์ทบทวนของสัปดาห์ไหนเพิ่มเติม บอกได้เลยครับ!`;
  }

  // 2. กดปุ่ม คุยเฉพาะเนื้อหารายวิชา
  if (text.includes("คุยเฉพาะเนื้อหารายวิชา") || text.includes("คุยเนื้อหารายวิชา")) {
    return "ยินดีครับ! ผมพร้อมช่วยอธิบายเนื้อหาและบทเรียนต่าง ๆ ในวิชานี้ให้ฟังอย่างเข้าใจง่าย คุณอยากให้ผมสรุป หรืออธิบายรายละเอียดเรื่องไหนเป็นพิเศษพิมพ์มาได้เลยนะครับ";
  }

  // 3. ถามให้อธิบายหัวข้อเจาะจง
  if (text.includes("อธิบายหัวข้อ")) {
    const topicName = text.replace("อธิบายหัวข้อ", "").replace("เนื้อหาเป็นยังไง", "").trim();
    const topicDisplay = topicName ? `"${topicName}"` : "ที่ระบุ";
    return `สำหรับหัวข้อ ${topicDisplay} นั้น จะสรุปเนื้อหาหลักที่สำคัญได้ดังนี้ครับ:\n\n` +
      `1. นิยามเบื้องต้น: เป็นหลักการพื้นฐานที่ใช้ในการจัดการหรือประมวลผลข้อมูลในโปรแกรม\n` +
      `2. รูปแบบโครงสร้าง (Syntax): มีรูปแบบการประกาศและเรียกใช้งานที่เป็นมาตรฐานตามภาษานั้น ๆ\n` +
      `3. ข้อควรระวัง: ระวังข้อผิดพลาดทางตรรกะ (Logic Error) และขอบเขตการทำงาน (Scope)\n\n` +
      `อยากให้ผมยกตัวอย่างโค้ด หรือทดลองออกโจทย์ทบทวนความเข้าใจในหัวข้อนี้ให้เลยไหมครับ?`;
  }

  // 4. ถามสรุปทั่วไป
  if (text.includes("สรุป")) {
    return `เนื้อหาหลักของ${wk} ได้แก่ ตัวแปรและชนิดข้อมูล · เงื่อนไขและการวนซ้ำ · ฟังก์ชัน — อยากให้เจาะหัวข้อไหนเพิ่มบอกได้เลยนะ`;
  }

  // 5. ข้อสอบ / ควิซ
  if (text.includes("ควิซ") || text.includes("ฝึก") || text.includes("ทบทวน")) {
    return `ได้เลย! นี่คือตัวอย่างข้อฝึกจาก${wk}:\n\n"ผลลัพธ์ของ 7 % 3 ในภาษา Python คือเท่าใด"\nก. 2.33  ข. 1  ค. 3  ง. 0\n(เฉลย: ข. 1)\n\nอยากได้ครบชุด 5 ข้อไหม? กด "สร้างควิซทบทวน" ได้เลย — ระบบจะออกโจทย์จากจุดที่ยังอ่อนให้`;
  }

  // 6. ถามตอบผิด / อธิบายคำตอบที่ผิด
  if (text.includes("ผิด") || text.includes("ทำไม")) {
    return `ลองส่งข้อที่ตอบผิดมาได้เลย เดี๋ยวช่วยอธิบายว่าทำไมคำตอบที่ถูกจึงเป็นแบบนั้น พร้อมชี้จุดที่ควรกลับไปทบทวนใน${wk}`;
  }

  return `รับทราบ! เดี๋ยวช่วยเรื่อง${wk}ให้ — ถามเนื้อหา ขอสรุป หรือให้ช่วยออกโจทย์ทบทวนก็ได้นะ`;
}

export default function StudentAssistant() {
  const pathname = usePathname();
  const weekNo = pathname.match(/\/student\/(?:quiz|summary)\/(\d+)/)?.[1];
  const weekLabel = weekNo ? `สัปดาห์ที่ ${weekNo}` : null;

  const suggestions = weekLabel
    ? ["อธิบายคำตอบที่ผิด", "อธิบายหัวข้อนี้"]
    : ["หัวข้อของรายวิชามีอะไรบ้าง", "อธิบายเนื้อหาของหัวข้อ"];

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "สวัสดีครับ! ผมเป็นผู้ช่วยสอนประจำวิชา ยินดีต้อนรับนักศึกษาเข้าสู่ระบบทบทวนบทเรียน หากมีเนื้อหาตรงไหนยังไม่เข้าใจ สอบถามเข้ามาได้เลยนะครับ",
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
        {
          id: `${Date.now()}-bot`,
          sender: "bot",
          text: mockReply(text, weekLabel),
        },
      ]);
    }, 900);
  }

  if (pathname === "/student" || pathname.includes("/student/quiz/")) {
    return null;
  }

  return (
    <>
      {/* ปุ่มเรียกผู้ช่วย (ซ่อนเมื่อเปิดอยู่) */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-tu-red-500 py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-lift transition hover:bg-tu-red-600 active:scale-95"
        >
          <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
          ผู้ช่วยทบทวน
        </button>
      )}

      {/* backdrop เฉพาะจอเล็ก (จอใหญ่เป็น side panel ไม่บังเนื้อหา) */}
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
        {/* header */}
        <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-tu-red-50 text-tu-red-600">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink-900">ผู้ช่วยทบทวนบทเรียน</p>
              <p className="truncate text-[11px] text-ink-400">
                {weekLabel ? `กำลังดู · ${weekLabel}` : "พร้อมช่วยทบทวนทุกสัปดาห์"}
              </p>
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

        {/* messages */}
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
                    คุณ
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

        {/* quick actions */}
        <div className="flex flex-wrap gap-1.5 border-t border-line-soft bg-paper-100/60 px-3 py-2.5">
          {suggestions.map((s) => (
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

        {/* input */}
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
              placeholder="ถามเนื้อหา หรือขอให้ช่วยออกโจทย์…"
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
