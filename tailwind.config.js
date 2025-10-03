/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base tokens
        'background': '#18181b',
        'foreground': '#fafaf9',
        'border': '#27272a',
        // Card
        'card': '#232326',
        'card-foreground': '#fafaf9',
        'card-border': '#27272a',
        // Modal
        'modal': '#232326',
        'modal-header': '#232326',
        'modal-content': '#232326',
        'modal-footer': '#232326',
        'modal-header-foreground': '#fafaf9',
        // Sidebar
        'sidebar': '#18181b',
        'sidebar-foreground': '#fafaf9',
        // Table
        'table': '#232326',
        'table-foreground': '#fafaf9',
        'table-border': '#27272a',
        // Button
        'button': '#27272a',
        'button-foreground': '#fafaf9',
        // Badge
        'badge': '#27272a',
        'badge-foreground': '#fafaf9',
        // Input
        'input': '#232326',
        'input-foreground': '#fafaf9',
        'input-border': '#27272a',
        // Label
        'label': '#fafaf9',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.bg-modal': { backgroundColor: '#232326' },
        '.bg-modal-header': { backgroundColor: '#232326' },
        '.bg-modal-content': { backgroundColor: '#232326' },
        '.bg-modal-footer': { backgroundColor: '#232326' },
      });
    }
  ],
}
