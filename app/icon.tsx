import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ตราสัญลักษณ์ลูกโป่งความคิด (thought bubble) บนพื้นแดงมน — คู่กับ Brand.tsx
      <div
        style={{
          background: "#C8102E",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
        }}
      >
        <svg viewBox="0 0 64 64" width="26" height="26" fill="none">
          <circle cx="10" cy="54" r="2.6" fill="#7A1020" />
          <circle cx="16" cy="47" r="4" fill="#7A1020" />
          <circle cx="20" cy="27" r="11" fill="#7A1020" />
          <circle cx="33" cy="17" r="13" fill="#7A1020" />
          <circle cx="47" cy="23" r="11" fill="#7A1020" />
          <circle cx="49" cy="35" r="10" fill="#7A1020" />
          <circle cx="35" cy="41" r="11" fill="#7A1020" />
          <circle cx="22" cy="38" r="10" fill="#7A1020" />
          <circle cx="50" cy="11" r="2.8" fill="#F2A900" />
          <circle cx="24" cy="30" r="2.8" fill="#FBF0EA" />
          <circle cx="33" cy="26" r="3.6" fill="#FBF0EA" />
          <circle cx="44" cy="18" r="4.6" fill="#FBF0EA" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
