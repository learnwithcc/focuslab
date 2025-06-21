import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        'primary-purple': {
          light: '#4a0e4e',
          dark: '#7b2cbf',
          DEFAULT: 'var(--primary-purple)',
        },
        'teal-primary': {
          light: '#00b2a9',
          dark: '#20c997',
          DEFAULT: 'var(--teal-primary)',
        },
        'orange-accent': {
          light: '#ff6b35',
          dark: '#fd7e14',
          DEFAULT: 'var(--orange-accent)',
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
