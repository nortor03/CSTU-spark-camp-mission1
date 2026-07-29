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
      // ImageResponse JSX element
      <div
        style={{
          background: "linear-gradient(135deg, #DC5462 0%, #C8102E 100%)", // Grad of TU Red
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "8px",
          border: "1.5px solid #F2A900", // TU Gold
          position: "relative",
        }}
      >
        {/* Graduation Cap SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            width: "55%",
            height: "55%",
          }}
        >
          <path d="M21.4 10.9a1 1 0 0 0 0-1.8L12.8 5.2a2 2 0 0 0-1.6 0L2.6 9.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.6 0l8.6-3.9z" />
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
          <path d="M21.5 12H18v5" />
        </svg>

        {/* Small gold checkmark badge on top right */}
        <div
          style={{
            position: "absolute",
            right: "-2px",
            top: "-2px",
            display: "flex",
            height: "10px",
            width: "10px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            backgroundColor: "#F2A900", // Gold
            border: "1px solid #C8102E", // Red border
            color: "white",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              width: "6px",
              height: "6px",
            }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
