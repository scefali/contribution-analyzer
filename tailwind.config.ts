import  { type Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme.js'
import tailwindcssRadix from 'tailwindcss-radix'

module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				sm: { min: '640px', max: '820px' },
				// => @media (min-width: 640px and max-width: 767px) { ... }

				md: { min: '820px', max: '1023px' },
				// => @media (min-width: 768px and max-width: 1023px) { ... }

				lg: { min: '1024px', max: '1279px' },
				// => @media (min-width: 1024px and max-width: 1279px) { ... }

				xl: { min: '1280px', max: '1535px' },
				// => @media (min-width: 1280px and max-width: 1535px) { ... }

				'2xl': { min: '1536px' },
				// => @media (min-width: 1536px) { ... }
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: "0px" },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height:"0px" },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
		fontFamily: {
			sans: [
				'Nunito Sans',
				'Nunito Sans Fallback',
				...defaultTheme.fontFamily.sans,
			],
		},
		fontSize: {
			// 1rem = 16px
			/** 80px size / 84px high / bold */
			mega: ['5rem', { lineHeight: '5.25rem', fontWeight: '700' }],
			/** 56px size / 62px high / bold */
			h1: ['3.5rem', { lineHeight: '3.875rem', fontWeight: '700' }],
			/** 40px size / 48px high / bold */
			h2: ['2.5rem', { lineHeight: '3rem', fontWeight: '700' }],
			/** 32px size / 36px high / bold */
			h3: ['2rem', { lineHeight: '2.25rem', fontWeight: '700' }],
			/** 28px size / 36px high / bold */
			h4: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
			/** 24px size / 32px high / bold */
			h5: ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
			/** 16px size / 20px high / bold */
			h6: ['1rem', { lineHeight: '1.25rem', fontWeight: '700' }],

			/** 32px size / 36px high / normal */
			'body-2xl': ['2rem', { lineHeight: '2.25rem' }],
			/** 28px size / 36px high / normal */
			'body-xl': ['1.75rem', { lineHeight: '2.25rem' }],
			/** 24px size / 32px high / normal */
			'body-lg': ['1.5rem', { lineHeight: '2rem' }],
			/** 20px size / 28px high / normal */
			'body-md': ['1.25rem', { lineHeight: '1.75rem' }],
			/** 16px size / 20px high / normal */
			'body-sm': ['1rem', { lineHeight: '1.25rem' }],
			/** 14px size / 18px high / normal */
			'body-xs': ['0.875rem', { lineHeight: '1.125rem' }],
			/** 12px size / 16px high / normal */
			'body-2xs': ['0.75rem', { lineHeight: '1rem' }],

			/** 18px size / 24px high / semibold */
			caption: ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
			/** 12px size / 16px high / bold */
			button: ['0.75rem', { lineHeight: '1rem', fontWeight: '700' }],
		},
		width: {
			'150': '600px',
		},
	},
	plugins: [
		require('tailwindcss-animate'),
		tailwindcssRadix,
		require('@tailwindcss/typography'),
	],
} satisfies Config
