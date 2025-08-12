/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                launch: {
                    '0%': { transform: 'translateY(0) scale(1)', opacity: 1 },
                    '30%': { transform: 'translateY(-10px) scale(1.1)', opacity: 1 },
                    '100%': { transform: 'translateY(-25px) scale(0.9)', opacity: 0 }
                }
            },
            animation: {
                launch: 'launch 0.8s ease-out',
            }
        },
    },
    plugins: [],
}

