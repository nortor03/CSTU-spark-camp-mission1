import type { Config } from "tailwindcss";

/**
 * ชุดสีธีมมหาวิทยาลัยธรรมศาสตร์ (แดง–เหลือง)
 * - tu.red  : สีแดงหลัก ใช้กับปุ่ม/แบรนด์
 * - tu.gold : สีเหลืองทอง ใช้กับ accent / ไฮไลต์
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
        // โทนครีมสำหรับพื้นหลังเว็บ (แดง–เหลือง–ครีม)
        cream: {
          50: "#FEFBF3",
          100: "#FAF3E3",
          200: "#F2E6C9",
          300: "#E7D4A8",
        },
        tu: {
          red: {
            50: "#FDECEE",
            100: "#FBD5D9",
            200: "#F4A6AE",
            300: "#EC7883",
            400: "#E24C59",
            500: "#C8102E", // สีแดงหลักธรรมศาสตร์
            600: "#A8162A",
            700: "#851421",
            800: "#631018",
            900: "#420A10",
          },
          gold: {
            50: "#FFF9E6",
            100: "#FFF0BF",
            200: "#FFE180",
            300: "#FFD24D",
            400: "#FFC72C",
            500: "#F2A900", // สีเหลืองทองธรรมศาสตร์
            600: "#C98A00",
            700: "#9C6B00",
            800: "#6E4C00",
            900: "#412D00",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-noto-thai)", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
