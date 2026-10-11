/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pantone: '#131936', // PANTONE 20-0142 TPM Neon Navy
        indigo: {
          50: '#f0f3fa',
          100: '#e0e7f6',
          200: '#c5d3ee',
          300: '#99b3df',
          400: '#5577be',
          500: '#25366f',
          600: '#131936', // Exact PANTONE 20-0142 TPM Neon Navy
          700: '#1b2550',
          800: '#0c1023',
          900: '#070a18',
          950: '#04050d',
        },
        navy: {
          950: '#070a16',
          900: '#0c1023', // Deep midnight background
          850: '#0f142b', // Elevated background
          800: '#131936', // Exact PANTONE 20-0142 TPM Neon Navy surface
          750: '#182042', // Card hover / border
          700: '#1d2752', // Border
          650: '#233064',
          600: '#283770', // Primary button
          500: '#394d9b', // Vivid sapphire accent
          400: '#526cd1',
          300: '#7d94e5',
          200: '#b0c0f5',
          100: '#dce4fc',
          50: '#f0f4fd',
        },
        brand: {
          50: '#f0f4fd',
          100: '#dce4fc',
          200: '#b0c0f5',
          300: '#7d94e5',
          400: '#526cd1',
          500: '#394d9b',
          600: '#25356e',
          700: '#1a2652',
          800: '#131936', // Exact Pantone Neon Navy
          900: '#0c1023',
        }
      }
    },
  },
  plugins: [],
}
