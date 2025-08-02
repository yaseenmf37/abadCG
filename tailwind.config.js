/** @type {import('tailwindcss').Config} */
export default {
  mode: "jit", // فعال کردن JIT Mode
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        vazir: ["Vazir", "sans-serif"],
        Far_Yekan: ["Far_Yekan", "sans-serif"],
        ordi: ["ordi", "sans-serif"],
      },
    },
    plugins: [],
  },
};
