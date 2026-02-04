/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                heading: ['var(--font-kanit)', 'sans-serif'],
                body: ['var(--font-mali)', 'sans-serif'],
            },
            colors: {
                primary: '#FF6B9D',
                secondary: '#00D4FF',
                accent: {
                    yellow: '#FFE66D',
                    lime: '#7BF1A8',
                    purple: '#B388FF',
                },
                playful: {
                    bg: '#FFF5F7',
                    fg: '#2D1B69',
                    border: '#FFB8D1',
                    muted: '#FFF0F5',
                }
            },
            animation: {
                'bounce-in': 'bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'wiggle': 'wiggle 0.3s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'pop': 'pop 0.3s ease-in-out',
                'sparkle': 'sparkle 2s ease-in-out infinite',
            },
            keyframes: {
                'bounce-in': {
                    '0%': { transform: 'scale(0.5)', opacity: '0' },
                    '50%': { transform: 'scale(1.05)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-2deg)' },
                    '50%': { transform: 'rotate(2deg)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                pop: {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)' },
                },
                sparkle: {
                    '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
                    '50%': { opacity: '0.8', filter: 'brightness(1.3)' },
                },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "gradient-playful": "linear-gradient(135deg, #FF6B9D 0%, #B388FF 100%)",
                "gradient-candy": "linear-gradient(135deg, #FFE66D 0%, #FF6B9D 50%, #B388FF 100%)",
            },
            borderRadius: {
                'playful': '16px',
            },
            boxShadow: {
                'playful': '4px 4px 0 #FF6B9D',
                'playful-soft': '0 8px 32px rgba(255, 107, 157, 0.2)',
            },
        },
    },
    plugins: [],
};
