import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        'primary-purple': {
          light: '#5A1A6D',
          dark: '#9D4EDD',
          DEFAULT: 'var(--primary-purple)',
        },
        'teal-primary': {
          light: '#007A73',
          dark: '#00E0C7',
          DEFAULT: 'var(--teal-primary)',
        },
        'orange-accent': {
          light: '#D95F02',
          dark: '#FD9E14',
          DEFAULT: 'var(--orange-accent)',
        },
        gray: {
          950: '#0a0a0a',
          975: '#050505',
        },
        'header-bg': 'var(--header-bg)',
        'header-primary-text': 'var(--header-primary-text)',
        'header-secondary-text': 'var(--header-secondary-text)',
        'header-primary-cta': 'var(--header-primary-cta)',
        'projects-bg': 'var(--projects-bg)',
        'button-teal-primary': 'var(--button-teal-primary)',
      },
      fontFamily: {
        sans: [
          "Open Sans",
          "ui-sans-serif", 
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji", 
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
        heading: [
          "Montserrat",
          "ui-sans-serif",
          "system-ui", 
          "sans-serif",
        ],
        mono: [
          "Roboto Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  variants: {
    extend: {
      animation: ['motion-safe'],
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
