import { NextRequest, NextResponse } from "next/server";

/**
 * ตัวกลาง (proxy) ไปยัง backend แยก syllabus จริง — เรียกจาก server ต่อ server
 * เพื่อเลี่ยงปัญหา CORS (backend ไม่ได้ตั้งค่า Access-Control-Allow-Origin ให้)
 * บราวเซอร์เรียกมาที่ endpoint นี้ (same-origin) แล้ว route นี้ค่อย forward ไฟล์ไปที่ backend จริง
 */
const API_BASE = (
  process.env.SYLLABUS_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const upstream = await fetch(`${API_BASE}/v1/syllabus-extractions`, {
    method: "POST",
    body: formData,
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
