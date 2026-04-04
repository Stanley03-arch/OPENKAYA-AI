/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kaya: {
          teal: "#00D4AA",
          purple: "#8B5CF6",
          amber: "#F59E0B",
          dark: "#0D0F14",
          card: "#1A1D24",
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      animation: {
        'typing': 'bounce 1.4s infinite ease-in-out both',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
