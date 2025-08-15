// tailwind.config.js (內建預設值)
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
        screens: {
        sm: '640px',  // 小螢幕 (平板直立)
        md: '768px',   // 中螢幕 (平板橫向 / 小筆電)
        lg: '1024px',  // 大螢幕 (桌機)
        xl: '1280px'  // 特大螢幕
    }
  },
  corePlugins: {
    preflight: false,
  },
};
