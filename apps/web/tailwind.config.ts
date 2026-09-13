import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171719",
        mist: "#f5f5f7",
        orchard: "#246b45",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.04), 0 18px 50px rgba(0,0,0,.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;

