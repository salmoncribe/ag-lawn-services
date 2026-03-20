import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1280px"
      }
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: {
          DEFAULT: "#166534",
          foreground: "#f8fafc"
        },
        accent: {
          DEFAULT: "#14532d",
          foreground: "#f8fafc"
        },
        secondary: {
          DEFAULT: "#f6e8cf",
          foreground: "#3f3a30"
        },
        muted: {
          DEFAULT: "#f6f2e9",
          foreground: "#5f5b53"
        },
        border: "#d4c8b6",
        input: "#efe3d2",
        ring: "#1f7a3f",
        chart: {
          1: "#166534",
          2: "#3f8c41",
          3: "#84cc16",
          4: "#f59e0b",
          5: "#14532d"
        }
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-body)"]
      },
      boxShadow: {
        meadow: "0 24px 60px -28px rgba(20, 83, 45, 0.4)",
        card: "0 24px 50px -30px rgba(20, 83, 45, 0.28)"
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.12), transparent 25%), linear-gradient(135deg, rgba(22,101,52,0.14), rgba(246,232,207,0.12))"
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem"
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
