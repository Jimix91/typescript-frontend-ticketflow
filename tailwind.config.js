/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        surface: {
          app: "#f4f7fb",
          0: "#ffffff",
          1: "#f8fafc",
          2: "#eef2f7",
          dark: "#0b1220",
          "dark-1": "#111827",
          "dark-2": "#1f2937",
        },
        status: {
          open: "#0ea5e9",
          progress: "#f59e0b",
          closed: "#10b981",
          danger: "#ef4444",
        },
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.08)",
        elevated: "0 10px 30px rgba(2, 6, 23, 0.12)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
}

