export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#5B5CFF',
          secondary: '#7A3CFF',
          accent: '#00D4FF',
          bg: '#0B0F1A',
          surface: '#12152A',
          text: '#F5F7FF',
          subtext: '#9AA3B2',
          border: 'rgba(154, 163, 178, 0.18)',
          panelSoft: 'rgba(255, 255, 255, 0.04)',
        },
      },
      fontFamily: {
        sans: ['Sora', 'Noto Sans KR', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glow: '0 20px 60px rgba(91, 92, 255, 0.22)',
        panel: '0 18px 40px rgba(5, 10, 24, 0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #5B5CFF 0%, #7A3CFF 55%, #00D4FF 100%)',
        'brand-bg':
          'radial-gradient(circle at 15% 18%, rgba(0, 212, 255, 0.12) 0%, transparent 22%), radial-gradient(circle at 88% 8%, rgba(122, 60, 255, 0.22) 0%, transparent 28%), linear-gradient(160deg, #0b0f1a 0%, #0f1324 52%, #0b1020 100%)',
      },
    },
  },
  plugins: [],
};
