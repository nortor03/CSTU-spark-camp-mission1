import type { Config } from "tailwindcss";

/**
 * ธีม "warm editorial" โทนธรรมศาสตร์ (แดง–ทอง) บนพื้นกระดาษครีม
 *
 * - tu.red   : สีแดงหลัก — แบรนด์, แถบหัว, ปุ่มหลัก
 * - tu.gold  : สีทอง — เส้นคั่น/accent บาง ๆ ไม่ใช้เป็นพื้นใหญ่
 * - paper    : พื้นหลังกระดาษ (แทนสีเทา slate เดิม)
 * - ink      : สีตัวอักษรโทนอุ่น (แทน slate)
 * - line     : สีเส้นขอบโทนอุ่น
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // พื้นหลังโทนกระดาษ
        paper: {
          50: "#FEFCF8",
          100: "#FBF7F0",
          200: "#F5EDE1",
          300: "#EDE2D1",
          DEFAULT: "#FBF7F0",
        },
        // ตัวอักษรโทนอุ่น — ใช้แทน slate ทั้งหมด
        ink: {
          900: "#1C1614",
          800: "#2A2320",
          700: "#4A403A",
          600: "#6B5D54",
          500: "#8A7B70",
          400: "#A99C92",
          300: "#C4B9AF",
          DEFAULT: "#2A2320",
        },
        // เส้นขอบ/เส้นคั่น
        line: {
          DEFAULT: "#E8DED0",
          soft: "#F0E8DC",
          strong: "#D6C8B4",
        },
        tu: {
          red: {
            50: "#FDF2F3",
            100: "#FBDFE2",
            200: "#F4B3BA",
            300: "#EA8892",
            400: "#DC5462",
            500: "#C8102E", // สีแดงหลักธรรมศาสตร์
            600: "#A80F27",
            700: "#851421",
            800: "#5E0F18",
            900: "#3B0A10",
          },
          gold: {
            50: "#FFFAEC",
            100: "#FFF1CC",
            200: "#FFE29A",
            300: "#FFD062",
            400: "#FFC02E",
            500: "#F2A900", // สีเหลืองทองธรรมศาสตร์
            600: "#C4870B",
            700: "#96660A",
            800: "#6B4907",
            900: "#412D00",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-noto-thai)", "sans-serif"],
        display: ["var(--font-noto-serif-thai)", "Georgia", "serif"],
      },
      boxShadow: {
        // เงานุ่ม โทนอุ่น — ใช้แทนกรอบหนา
        card: "0 1px 2px rgba(42,35,32,0.04), 0 10px 30px -18px rgba(42,35,32,0.25)",
        lift: "0 2px 6px rgba(42,35,32,0.06), 0 18px 40px -22px rgba(42,35,32,0.35)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.6)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97) translateY(4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "scale-in": "scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
