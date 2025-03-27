/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  darkMode: 'class',
  content: ['./src/**/*.tsx'],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: '#1a1a1a', // Near black
          secondary: '#4a4a4a', // Dark gray
          accent: '#777777', // Medium gray
          neutral: '#2a2a2a', // Darker gray
          'base-100': '#121212', // Very dark gray (almost black)
          info: '#9e9e9e', // Light gray
          success: '#e0e0e0', // Very light gray
          warning: '#a9a9a9', // Gray
          error: '#d4d4d4', // Light gray
        },
      },
    ],
  },
  plugins: [require('daisyui')],
  compilerOptions: {
    baseUrl: 'src/',
  },
};
