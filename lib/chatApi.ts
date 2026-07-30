/* ==========================================================================
   จุดเชื่อม backend สำหรับ "ผู้ช่วยทบทวนบทเรียน" — คุยถามตอบเนื้อหาวิชาแบบ RAG
   ยืนยันแล้วว่า deploy จริง ทดสอบกับ AI จริง (116 เคสผ่าน, ruff clean)

   POST /api/v1/chat/stream
     body: { courseCode, prompt } — required ทั้งคู่ ห้ามว่าง (422 ถ้าขาด)
     backend เอา courseCode ไปแทรกข้อความก่อนส่งต่อให้ AI เอง — frontend ส่ง
     prompt เป็นคำถามดิบได้เลย ไม่ต้องแทรกเอง

   Response: ไม่ใช่ JSON ก้อนเดียว — SSE (text/event-stream) proxy ตรงจาก AI
   แบบ byte-ต่อ-byte มี event 3 แบบ:
     event: progress — สถานะระหว่างทำงาน (ไม่ต้องแสดงก็ได้)
     event: delta    — {"text": "..."} ทีละส่วน ต่อกันเพื่อ typing effect
     event: done      — {"answer", "sources": [{course_code, week_number,
                          document_id, filename, source_location}], "thread_id"}
                        ใช้เป็นคำตอบสุดท้าย (authoritative)
   ========================================================================== */

const CHAT_API_URL = (
  process.env.NEXT_PUBLIC_QUIZ_API_URL ??
  process.env.NEXT_PUBLIC_COURSES_API_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

export interface ChatSource {
  courseCode: string;
  weekNumber: number | null;
  documentId: string;
  filename: string;
  sourceLocation: string | null;
}

export interface ChatStreamResult {
  answer: string;
  sources: ChatSource[];
  threadId: string;
}

interface RawChatSource {
  course_code: string;
  week_number: number | null;
  document_id: string;
  filename: string;
  source_location: string | null;
}

function mapSource(s: RawChatSource): ChatSource {
  return {
    courseCode: s.course_code,
    weekNumber: s.week_number ?? null,
    documentId: s.document_id,
    filename: s.filename,
    sourceLocation: s.source_location ?? null,
  };
}

/** แยก 1 ก้อน SSE ("event: x\ndata: y") เป็น {event, data} — คืน null ถ้าไม่มี data */
function parseSseBlock(block: string): { event: string; data: string } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

/**
 * ถามผู้ช่วย AI แบบ stream — เรียก onDelta ทีละส่วนของคำตอบระหว่างทาง (typing
 * effect) แล้ว resolve เป็นคำตอบเต็ม+แหล่งอ้างอิงตอน event "done" มาถึง
 */
export async function streamChatReply(
  courseCode: string,
  prompt: string,
  onDelta?: (text: string) => void,
): Promise<ChatStreamResult> {
  const res = await fetch(`${CHAT_API_URL}/api/v1/chat/stream`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ courseCode, prompt }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`คุยกับผู้ช่วยไม่สำเร็จ (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: ChatStreamResult | null = null;

  while (true) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);
      const evt = parseSseBlock(raw);
      if (!evt) continue;

      if (evt.event === "delta") {
        const payload = JSON.parse(evt.data) as { text: string };
        onDelta?.(payload.text);
      } else if (evt.event === "done") {
        const payload = JSON.parse(evt.data) as {
          answer: string;
          sources: RawChatSource[];
          thread_id: string;
        };
        result = {
          answer: payload.answer,
          sources: (payload.sources ?? []).map(mapSource),
          threadId: payload.thread_id,
        };
      }
      // event: progress — ไม่ต้องทำอะไร
    }
  }

  if (!result) throw new Error("การตอบกลับจากผู้ช่วยไม่สมบูรณ์");
  return result;
}
