"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Send, X, ClipboardList, BookOpen } from "lucide-react";
import { useCourse } from "@/lib/courseStore";
import { streamChatReply, type ChatSource } from "@/lib/chatApi";

/**
 * ผู้ช่วยทบทวนฝั่งนักศึกษา — side panel สไตล์ "Claude in Chrome"
 * - เลื่อนออกมาจากขวา อยู่ข้างเนื้อหา (บนจอใหญ่ไม่บังทั้งจอ)
 * - รู้ว่ากำลังอยู่สัปดาห์ไหน (อ่านจาก path) เพื่อตอบให้ตรงบริบท
 * - คุยกับ AI จริงผ่าน POST /api/v1/chat/stream (RAG จากเอกสารในคอร์ส) —
 *   ดู lib/chatApi.ts
 */

interface Msg {
  id: string;
  sender: "bot" | "user";
  text: string;
  /** true = กำลัง stream คำตอบอยู่ (ยังไม่ถึง event "done") */
  streaming?: boolean;
  sources?: ChatSource[];
}

export default function StudentAssistant() {
  const pathname = usePathname();
  const weekNo = pathname.match(/\/student\/(?:quiz|summary)\/(\d+)/)?.[1];
  const weekLabel = weekNo ? `สัปดาห์ที่ ${weekNo}` : null;
  const { activeCourse } = useCourse();
  const courseCode = activeCourse?.courseCode ?? null;

  const suggestions = weekLabel
    ? ["อธิบายคำตอบที่ผิด", "อธิบายหัวข้อนี้"]
    : ["หัวข้อของรายวิชามีอะไรบ้าง", "อธิบายเนื้อหาของหัวข้อ"];

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
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
  }, [messages, open]);

  const isStreaming = messages.some((m) => m.streaming);

  async function send(text: string) {
    if (!text.trim() || isStreaming) return;
    const userMsg: Msg = { id: Date.now().toString(), sender: "user", text };
    setInput("");

    if (!courseCode) {
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `${Date.now()}-bot`,
          sender: "bot",
          text: "ยังไม่พบรายวิชาที่กำลังเปิดอยู่ ลองกลับไปหน้ารายวิชาแล้วเปิดผู้ช่วยอีกครั้งนะครับ",
        },
      ]);
      return;
    }

    const botId = `${Date.now()}-bot`;
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: botId, sender: "bot", text: "", streaming: true },
    ]);

    try {
      const result = await streamChatReply(courseCode, text, (delta) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, text: m.text + delta } : m)),
        );
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, text: result.answer, sources: result.sources, streaming: false }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, text: "ขออภัยครับ ตอนนี้คุยกับผู้ช่วยไม่สำเร็จ ลองใหม่อีกครั้งนะครับ", streaming: false }
            : m,
        ),
      );
    }
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
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    isBot
                      ? "rounded-tl-sm border border-line-soft bg-white text-ink-700"
                      : "rounded-tr-sm bg-tu-red-500 text-white"
                  }`}
                >
                  {m.streaming && !m.text ? (
                    <div className="flex items-center gap-1 py-0.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:0.3s]" />
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  )}

                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-line-soft bg-paper-50 px-3 py-2">
                      <BookOpen className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-400" />
                      <p className="text-[11px] leading-relaxed text-ink-600">
                        <span className="font-semibold text-ink-500">อ้างอิงจาก: </span>
                        {m.sources
                          .map((s) =>
                            s.sourceLocation ? `${s.filename} (${s.sourceLocation})` : s.filename,
                          )
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* quick actions */}
        <div className="flex flex-wrap gap-1.5 border-t border-line-soft bg-paper-100/60 px-3 py-2.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={isStreaming}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink-600 transition hover:border-tu-red-200 hover:bg-tu-red-50 hover:text-tu-red-600 disabled:opacity-40"
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
              disabled={isStreaming}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-800 outline-none placeholder:text-ink-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
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
