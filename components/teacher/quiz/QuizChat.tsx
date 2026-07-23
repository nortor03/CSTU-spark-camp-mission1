"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
}

const PRESET_ANSWERS: Record<string, string> = {
  "ช่วยเพิ่มคำถามบทนำ": "ได้ค่ะ! นี่คือไอเดียสำหรับคำถามบทนำสัปดาห์นี้ค่ะ:\n\n**ข้อ 3: ข้อใดคือเป้าหมายหลักของการเขียนโปรแกรมคอมพิวเตอร์?**\nก. การออกแบบรูปภาพสวยงาม\nข. การแก้ปัญหาอย่างมีลำดับขั้นตอนเพื่อให้คอมพิวเตอร์ทำงานตามสั่ง\nค. การติดตั้งระบบปฏิบัติการใหม่\nง. การแฮกเครือข่ายสังคมออนไลน์\n\n*เฉลย: ข. การแก้ปัญหาอย่างมีลำดับขั้นตอน*",
  "ปรับระดับคำถามให้ยากขึ้น": "แน่นอนค่ะ! เพื่อเพิ่มความท้าทายในหัวข้อนี้ เราสามารถปรับคำถามให้เน้นการคิดวิเคราะห์เชิงลึก (Critical Thinking) หรือเพิ่มการเขียนโปรแกรมสั้นๆ (Code Reading) ได้ เช่น ให้ผู้เรียนหาผลลัพธ์ของลูป หรือระบุจุดผิดพลาด (Bug) ในชุดคำสั่งจำลองค่ะ",
  "ขอคำอธิบายหัวข้อสัปดาห์นี้": "หัวข้อหลักของสัปดาห์นี้ประกอบด้วยเรื่อง: บทนำสู่การเขียนโปรแกรม, ตัวแปรและชนิดข้อมูล, เงื่อนไขและการวนซ้ำ เพื่อปูพื้นฐานการพัฒนาโปรแกรมเบื้องต้นค่ะ",
};

export default function QuizChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "สวัสดีค่ะ! ยินดีต้อนรับสู่ระบบช่วยออกแบบแบบทดสอบ มีหัวข้อหรือระดับความยากแบบไหนที่อยากให้ช่วยแนะนำเพิ่มเติมไหมคะ? 🤖✨",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  function handleSend(text: string) {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking and reply
    setTimeout(() => {
      setIsTyping(false);
      const answer =
        PRESET_ANSWERS[text] ||
        "รับทราบค่ะ! ทาง AI กำลังช่วยเตรียมแนวทางออกแบบคำถามให้เพิ่มเติมในส่วนนี้ คุณสามารถนำแนวคิดไปวางในคำถามของควิซได้เลยนะคะ มีส่วนไหนอยากให้ช่วยปรับอีกแจ้งได้เลยค่ะ";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1200);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-tu-red-500 text-white shadow-lg hover:scale-105 hover:bg-tu-red-600 active:scale-95 transition-all duration-200"
          title="เปิดผู้ช่วยสร้างควิซ"
        >
          <svg
            className="h-6 w-6 transition-transform group-hover:rotate-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {/* Badge alert */}
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-tu-gold-500 text-[10px] font-bold text-white ring-2 ring-white">
            1
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-line-soft bg-white shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-tu-red-600 to-tu-red-500 px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                <svg className="h-5 w-5 text-tu-gold-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm font-bold leading-tight">AI ช่วยสร้างคำถาม</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-tu-red-100 hover:bg-white/10 hover:text-white transition"
              title="ย่อหน้ารวม"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
          </div>

          {/* Messages Body */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-paper-50/50 p-4 space-y-3.5 scrollbar-thin"
          >
            {messages.map((msg) => {
              const isBot = msg.sender === "bot";
              return (
                <div key={msg.id} className={`flex items-start gap-2.5 ${!isBot ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  {isBot ? (
                    <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-tu-red-50 text-tu-red-600 border border-tu-red-100">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-tu-gold-500 text-white font-bold text-xs">
                      T
                    </div>
                  )}

                  {/* Bubble */}
                  <div className="max-w-[75%] space-y-1">
                    <div
                      className={`rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                        isBot
                          ? "bg-white text-ink-800 shadow-sm border border-line-soft rounded-tl-none"
                          : "bg-tu-red-500 text-white shadow-sm rounded-tr-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <p className={`text-[9px] text-ink-400 px-1 ${!isBot ? "text-right" : ""}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-start gap-2.5">
                <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-tu-red-50 text-tu-red-600 border border-tu-red-100">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="bg-white border border-line-soft rounded-2xl rounded-tl-none px-3 py-2 shadow-sm">
                  <span className="flex items-center gap-1 text-[11px] font-medium text-ink-400">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:0.4s]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="bg-paper-50 px-3 py-2 border-t border-line-soft flex flex-wrap gap-1.5">
            {Object.keys(PRESET_ANSWERS).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSend(suggestion)}
                className="rounded-full bg-white hover:bg-tu-red-50 hover:text-tu-red-600 border border-line hover:border-tu-red-200 px-2.5 py-1 text-[10px] font-medium text-ink-600 transition"
              >
                💡 {suggestion}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="border-t border-line-soft bg-white p-3"
          >
            <div className="flex items-center gap-2 rounded-full bg-paper-100 px-4 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="พิมพ์ข้อความที่นี่..."
                className="flex-1 bg-transparent text-xs text-ink-800 outline-none placeholder:text-ink-400"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="text-tu-red-500 hover:text-tu-red-600 disabled:opacity-30 disabled:hover:text-tu-red-500 transition-colors duration-150 flex-shrink-0"
                title="ส่งข้อความ"
              >
                <svg className="h-5 w-5 transform rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
