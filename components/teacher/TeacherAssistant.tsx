"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Send, X, ClipboardList, Undo2, Check } from "lucide-react";
import { useCourse } from "@/lib/courseStore";
import {
  reviseQuiz,
  summarizeQuizDiff,
  getChangedQuestionIds,
} from "@/lib/quizChatApi";
import type { Quiz } from "@/lib/quiz";
import { saveQuizToBackend } from "@/lib/quizzesApi";

/**
 * ผู้ช่วยจัดการรายวิชาฝั่งอาจารย์ — side panel สไตล์ "Claude in Chrome"
 * (คู่กับ StudentAssistant ฝั่งนักเรียน) mount ใน TeacherShell → ขึ้นทุกหน้า
 * รวมความสามารถของ QuizChat เดิม (ช่วยออกแบบคำถาม) ไว้เป็น quick action
 *
 * โหมด: ถ้าอยู่ในหน้าสร้าง/แก้ควิซของสัปดาห์ใด ๆ (path มี /quiz/{n}) จะกลายเป็น
 * ผู้ช่วยแก้ไขควิซจริง (ต่อ AI จริงผ่าน lib/quizChatApi.ts) — หน้าอื่นยังเป็น mock อยู่
 */

interface Msg {
  id: string;
  sender: "bot" | "user";
  text: string;
}

/** ปุ่มคำถามแนะนำ — อิงตามหน้าที่อาจารย์กำลังเปิดอยู่ */
function suggestionsFor(pathname: string): string[] {
  if (pathname.startsWith("/quiz")) {
    return [
      "ปรับระดับคำถามให้ยากขึ้น",
      "ปรับระดับคำถามให้ง่ายลง",
      "เพิ่มตัวเลือกหลอก",
    ];
  }
  if (pathname.startsWith("/report")) {
    return [
      "สรุปผลชั้นเรียน",
      "หัวข้อที่นักศึกษายังอ่อน",
      "นักศึกษาที่ควรดูแลเป็นพิเศษ",
      "เทียบผลข้อสอบกับการฝึกซ้อม",
    ];
  }
  if (pathname.startsWith("/topics")) {
    return [
      "แนะนำการจัดหัวข้อเข้าสัปดาห์",
      "หัวข้อนี้ควรผูกกับ CLO ไหน",
      "จัดลำดับเนื้อหาให้เหมาะสม",
      "หัวข้อที่ควรเน้น",
    ];
  }
  if (pathname.startsWith("/course") || pathname.startsWith("/upload")) {
    return [
      "สรุปภาพรวมรายวิชา",
      "ช่วยวางแผนการสอน",
      "สร้างควิซใหม่",
      "แนะนำเกณฑ์ประเมิน",
    ];
  }
  return [
    "ช่วยออกแบบคำถาม",
    "สรุปผลชั้นเรียน",
    "หัวข้อที่นักศึกษายังอ่อน",
    "ปรับระดับคำถามให้ยากขึ้น",
  ];
}

/** context สั้น ๆ จาก path ปัจจุบัน */
function contextLabel(pathname: string): string {
  const wk = pathname.match(/\/quiz\/(\d+)/)?.[1];
  if (wk) return `กำลังสร้างควิซ · สัปดาห์ที่ ${wk}`;
  if (pathname.startsWith("/report")) return "กำลังดูรายงานชั้นเรียน";
  if (pathname.startsWith("/topics")) return "กำลังจัดหัวข้อ";
  if (pathname.startsWith("/course")) return "กำลังดูรายวิชา";
  return "พร้อมช่วยจัดการรายวิชา";
}

/** key สัปดาห์ภายใน ("สัปดาห์ที่ N") ถ้ากำลังอยู่หน้าสร้าง/แก้ควิซของสัปดาห์นั้น — ไม่งั้น null */
function weekKeyFromPathname(pathname: string): string | null {
  const wk = pathname.match(/\/quiz\/(\d+)/)?.[1];
  return wk ? `สัปดาห์ที่ ${wk}` : null;
}

/** คำตอบจำลอง — ปรับตามข้อความ */
function mockReply(text: string): string {
  if (text.includes("ออกแบบคำถาม") || text.includes("เพิ่มคำถาม")) {
    return 'ได้เลย! นี่คือตัวอย่างคำถามปรนัย:\n\n"ข้อใดคือเป้าหมายหลักของการเขียนโปรแกรม?"\nก. ออกแบบรูปภาพ\nข. แก้ปัญหาอย่างมีลำดับขั้นตอน\nค. ติดตั้งระบบปฏิบัติการ\nง. จัดการฐานข้อมูล\n(เฉลย: ข.)\n\nอยากให้ปรับหัวข้อ/ระดับความยากเพิ่มบอกได้เลย';
  }
  if (text.includes("ง่าย")) {
    return "เพื่อลดความยาก ลองปรับเป็นคำถามนิยาม/จำแนกตรง ๆ (เช่น ข้อใดคือตัวแปร) ลดจำนวนตัวเลือก หรือใส่ตัวอย่างประกอบในโจทย์ เพื่อให้นักศึกษาที่ยังไม่มั่นใจตอบได้";
  }
  if (text.includes("ยาก") || text.includes("ระดับ")) {
    return "เพื่อเพิ่มความท้าทาย ลองปรับเป็นคำถามคิดวิเคราะห์ (เช่น หาผลลัพธ์ของลูป) หรือให้หาจุดผิด (bug) ในชุดคำสั่ง แทนการถามนิยามตรง ๆ";
  }
  if (text.includes("สรุปผล") || text.includes("ชั้นเรียน")) {
    return "ภาพรวมชั้นเรียน (ตัวอย่าง): ค่าเฉลี่ย 68% · ผ่านเกณฑ์ 74% ของนักศึกษา · หัวข้อที่คะแนนต่ำสุดคือ “เงื่อนไขและการวนซ้ำ” — แนะนำให้ทบทวนซ้ำในคาบถัดไป";
  }
  if (text.includes("ตัวลวง") || text.includes("ตัวเลือก")) {
    return "เทคนิคออกตัวลวง (distractor) ที่ดี: อิงจาก “ความเข้าใจผิดที่พบบ่อย” ของนักศึกษา เช่น สลับลำดับขั้นตอน, ใช้เครื่องหมายผิด (= กับ ==), หรือเงื่อนไขที่ดูสมเหตุสมผลแต่ผิด — จะช่วยแยกคนที่เข้าใจจริงออกจากคนเดา";
  }
  if (text.includes("เฉลย") || text.includes("คำอธิบาย")) {
    return "ตัวอย่างคำอธิบายเฉลย: “ข้อนี้ตอบ ข. เพราะการวนซ้ำจะหยุดเมื่อเงื่อนไขเป็นเท็จ — ตัวเลือกอื่นเข้าใจสลับกันระหว่างลูปกับเงื่อนไข if” อยากให้เขียนเฉลยข้อไหนวางคำถามมาได้เลย";
  }
  if (text.includes("ดูแล") || text.includes("พิเศษ")) {
    return "นักศึกษาที่ควรดูแลเป็นพิเศษ (ตัวอย่าง): คะแนนต่ำกว่า 40% ติดต่อกัน 2 สัปดาห์ และยังไม่เข้าฝึกซ้อมเลย — แนะนำนัดพูดคุยหรือมอบโจทย์เสริมเฉพาะจุดที่อ่อน";
  }
  if (text.includes("เทียบ") || text.includes("ฝึกซ้อม")) {
    return "เทียบข้อสอบจริงกับการฝึกซ้อม (ตัวอย่าง): หัวข้อ “ฟังก์ชัน” คะแนนสอบจริง 62% แต่หลังฝึกซ้อมขยับเป็น 78% — แปลว่านักศึกษาพัฒนาได้เมื่อฝึกเพิ่ม ควรกระตุ้นให้ฝึกซ้อมหัวข้อที่ยังต่ำ";
  }
  if (text.includes("CLO") || text.includes("จัดหัวข้อ") || text.includes("สัปดาห์")) {
    return "แนะนำการจัดหัวข้อ: จับหัวข้อพื้นฐานไว้สัปดาห์ต้น ๆ แล้วไล่ไปหัวข้อที่ต่อยอด และผูกแต่ละหัวข้อกับ CLO ที่เกี่ยวข้องเพื่อให้ประเมินผลได้ตรงเป้า — บอกหัวข้อที่อยากจัดมาได้เลย";
  }
  if (text.includes("แผนการสอน") || text.includes("ภาพรวม") || text.includes("รายวิชา")) {
    return "ภาพรวมรายวิชา (ตัวอย่าง): 6 หัวข้อหลัก กระจายใน 6 สัปดาห์ · มีควิซ 2 สัปดาห์ · CLO 4 ข้อ — อยากให้ช่วยวางแผนคาบไหนหรือเพิ่มควิซสัปดาห์ใดบอกได้เลย";
  }
  if (text.includes("เกณฑ์") || text.includes("ประเมิน")) {
    return "ตัวอย่างเกณฑ์ประเมิน: ควิซรายสัปดาห์ 30% · โปรเจกต์ 40% · สอบปลายภาค 30% — ปรับสัดส่วนตามน้ำหนักที่ต้องการเน้นได้ อยากให้ช่วยออกแบบ rubric ของงานไหนบอกมาได้";
  }
  if (text.includes("สร้างควิซ")) {
    return "ได้เลย! บอกหัวข้อ + จำนวนข้อ + ระดับความยากที่ต้องการ แล้วผมช่วยร่างชุดคำถามให้ หรือกดปุ่ม “สร้างควิซ” ในหน้ารายวิชาเพื่อเริ่มก็ได้";
  }
  if (text.includes("อ่อน") || text.includes("หัวข้อ")) {
    return "หัวข้อที่นักศึกษายังอ่อน (ตัวอย่าง): 1) การวนซ้ำซ้อน 2) ขอบเขตตัวแปรในฟังก์ชัน 3) การจัดการข้อผิดพลาด — อยากให้ช่วยออกโจทย์เสริมหัวข้อไหนบอกได้เลย";
  }
  return "รับทราบ! ช่วยได้ทั้งออกแบบคำถาม สรุปผลชั้นเรียน หรือแนะนำหัวข้อที่ควรเน้น — บอกได้เลยว่าจะให้ช่วยเรื่องไหน";
}

export default function TeacherAssistant() {
  const pathname = usePathname();
  if (pathname === "/course" || pathname === "/report") {
    return null;
  }
  const ctx = contextLabel(pathname);
  const weekKey = weekKeyFromPathname(pathname);
  const suggestions = suggestionsFor(pathname);
  // ในหน้าสร้าง/แก้ควิซ ผู้ช่วยจะเป็น "ผู้ช่วยออกแบบข้อสอบ" (คนละตัวกับผู้ช่วยทั่วไป)
  const assistantName = weekKey ? "ผู้ช่วยออกแบบข้อสอบ" : "ผู้ช่วยอาจารย์";

  const {
    topics,
    clos,
    courseCode,
    activeCourseId,
    getQuiz,
    saveQuiz,
    pendingQuizRevisions,
    setPendingQuizRevision,
  } = useCourse();
  // จำ editPrompt แรกของบทสนทนานี้ไว้ส่งเป็น originalPrompt (optional) ในการแก้ไขรอบถัด ๆ ไป
  const firstPromptRef = useRef<string | null>(null);
  // ผลแก้ไขล่าสุดที่ยังไม่ได้กดยืนยันบันทึก — อยู่ใน store กลาง (ไม่ใช่ local state) เพราะ
  // QuizEditor ต้องอ่านค่าเดียวกันนี้ไปโชว์ preview ด้วย
  const pendingRevision = weekKey ? (pendingQuizRevisions[weekKey] ?? null) : null;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let welcome = "สวัสดีครับอาจารย์ มีส่วนใดที่ผมสามารถช่วยอำนวยความสะดวกในการจัดสรรวิชา ออกแบบข้อสอบ หรือสรุปผลในวันนี้ แจ้งได้เลยนะครับ";
    
    if (pathname.startsWith("/quiz")) {
      welcome = `สวัสดีครับอาจารย์ ยินดีต้อนรับสู่ระบบช่วยออกแบบข้อสอบของ ${weekKey || "สัปดาห์นี้"} อาจารย์สามารถเลือกหัวข้อที่ต้องการเน้น ปรับระดับความยาก หรือเพิ่มตัวเลือกหลอกได้ทันทีครับ`;
    }

    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: welcome,
      },
    ]);
    firstPromptRef.current = null;
  }, [pathname, weekKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  function pushBotMessage(text: string) {
    setMessages((prev) => [...prev, { id: `${Date.now()}-bot`, sender: "bot", text }]);
  }

  /** โหมดแก้ไขควิซจริง — เฉพาะตอนอยู่หน้าสร้าง/แก้ควิซของสัปดาห์ใดสัปดาห์หนึ่ง */
  async function sendQuizEdit(text: string, week: string) {
    try {
      if (!courseCode) {
        throw new Error(
          "วิชานี้ยังไม่มีรหัสวิชา — กรุณาระบุรหัสวิชาก่อนใช้ผู้ช่วยแก้ไขควิซ",
        );
      }

      // ถ้ามีผลแก้ไขที่ยังไม่ได้บันทึกค้างอยู่ ให้คุยต่อยอดจากอันนั้น ไม่ใช่ย้อนกลับไปตัวที่บันทึกไว้แล้ว
      const currentQuiz = pendingRevision ?? getQuiz(week) ?? null;
      if (!currentQuiz) {
        throw new Error(
          "สัปดาห์นี้ยังไม่มีแบบทดสอบให้แก้ไข — ไปสร้างแบบทดสอบก่อนแล้วค่อยกลับมาคุยกับผู้ช่วย",
        );
      }
      if (clos.length === 0) {
        throw new Error(
          "วิชานี้ยังไม่มี CLO เลย — กรุณาเพิ่ม CLO อย่างน้อย 1 ข้อก่อนใช้ผู้ช่วยแก้ไขควิซ",
        );
      }

      const topic =
        topics
          .filter((t) => t.weekAssigned === week)
          .map((t) => t.title)
          .join(", ") || week;
      const questionCount = currentQuiz.questions.length || 1;
      // backend บังคับ description ต้องเป็น string ไม่ว่าง ๆ — CLO ที่ syllabus ไม่ได้ระบุคำอธิบาย (null) fallback เป็น code แทน
      const closPayload = clos.map((c) => ({
        code: c.code,
        description: c.description || c.code,
      }));

      const revised = await reviseQuiz({
        week,
        courseCode,
        topic,
        clos: closPayload,
        questionCount,
        editPrompt: text,
        previousQuiz: currentQuiz,
        originalPrompt: firstPromptRef.current ?? undefined,
      });
      if (firstPromptRef.current === null) firstPromptRef.current = text;

      // backend/AI มินต์ id ใหม่ให้ทุกครั้ง (ไม่คืน id เดิมมาด้วย) — ถ้าไม่บังคับให้ตรงกับ
      // ของเดิม ตอน saveQuiz จะมองว่าเป็นควิซใหม่แล้ว push เพิ่มเป็นชุดที่ 2 แทนที่จะทับของเดิม
      // (revise ควรแก้ไขต่อยอดชุดเดียวกัน ไม่ใช่สร้างชุดใหม่) เก็บ isActive เดิมไว้ด้วยเหตุผลเดียวกัน
      const edited: Quiz = {
        ...revised,
        id: currentQuiz.id,
        isActive: currentQuiz.isActive,
      };

      const diff = summarizeQuizDiff(currentQuiz, edited);
      const changedIds = getChangedQuestionIds(currentQuiz, edited);

      // ยังไม่บันทึก — แค่โชว์ผลให้ดูก่อน คุยต่อแก้เพิ่มได้ หรือกด "บันทึกแบบทดสอบ" ด้านล่างเมื่อพอใจ
      setPendingQuizRevision(week, edited, changedIds);
      pushBotMessage(
        `ลองแก้ไขมาให้ดูก่อนนะครับ (ยังไม่ได้บันทึก)\n\nสิ่งที่เปลี่ยน:\n${diff}\n\nพอใจแล้วกด "บันทึกการแก้ไข" ด้านล่าง หรือจะบอกให้แก้เพิ่มก็ได้เลย`,
      );
    } catch (err) {
      pushBotMessage(
        err instanceof Error ? err.message : "แก้ไขแบบทดสอบไม่สำเร็จ ลองใหม่อีกครั้ง",
      );
    } finally {
      setTyping(false);
    }
  }

  /** ยืนยันบันทึกผลแก้ไขที่ค้างไว้ — เพิ่งตอนนี้ที่ค่อย persist (เหมือนกด "บันทึกแบบทดสอบ" ใน QuizEditor) */
  function confirmRevision() {
    if (!weekKey || !pendingRevision) return;
    saveQuiz(weekKey, pendingRevision);
    if (activeCourseId) {
      saveQuizToBackend(activeCourseId, weekKey, pendingRevision).catch((err) => {
        console.error(
          "บันทึกแบบทดสอบที่ backend ไม่สำเร็จ (ยังบันทึกในเครื่องได้ปกติ)",
          err,
        );
      });
    }
    setPendingQuizRevision(weekKey, null);
    pushBotMessage("บันทึกการแก้ไขเรียบร้อยแล้ว!");
  }

  /** ยกเลิกผลแก้ไขที่ค้างไว้ — ยังใช้ชุดเดิมที่บันทึกไว้ล่าสุดต่อไป */
  function discardRevision() {
    if (!weekKey) return;
    setPendingQuizRevision(weekKey, null);
    pushBotMessage("ย้อนกลับแล้วครับ ยังใช้แบบทดสอบชุดเดิมอยู่");
  }

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Msg = { id: Date.now().toString(), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    if (weekKey) {
      sendQuizEdit(text, weekKey);
      return;
    }

    // หน้าอื่น ๆ ที่ไม่ใช่การสร้าง/แก้ควิซ — ยังเป็น mock อยู่
    setTimeout(() => {
      setTyping(false);
      pushBotMessage(mockReply(text));
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
          {assistantName}
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
              <p className="text-sm font-bold text-ink-900">{assistantName}</p>
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

        {/* มีผลแก้ไขที่ยังไม่ได้บันทึกค้างอยู่ — ให้ยืนยันหรือยกเลิกก่อนคุยเรื่องอื่นต่อ */}
        {pendingRevision && (
          <div className="flex items-center gap-2 border-t border-line-soft bg-tu-gold-50 px-3.5 py-2.5">
            <span className="flex flex-1 items-center gap-1.5 text-[11px] font-semibold text-tu-gold-700">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
              มีผลแก้ไขที่ยังไม่ได้บันทึก
            </span>
            <button
              type="button"
              onClick={discardRevision}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-ink-500 transition hover:bg-paper-200 hover:text-ink-700"
            >
              <Undo2 className="h-3.5 w-3.5" />
              ย้อนกลับ
            </button>
            <button
              type="button"
              onClick={confirmRevision}
              className="flex items-center gap-1 rounded-lg bg-tu-red-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-tu-red-600"
            >
              <Check className="h-3.5 w-3.5" />
              บันทึกการแก้ไข
            </button>
          </div>
        )}

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
