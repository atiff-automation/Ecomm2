import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: {
  			DEFAULT: '1rem',
  			sm: '1.5rem',
  			md: '2rem',
  			lg: '2.5rem',
  			xl: '3rem',
  			'2xl': '4rem'
  		},
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontSize: {
  			display: [
  				'clamp(2.5rem, 6vw, 4rem)',
  				{
  					lineHeight: '1.1',
  					letterSpacing: '-0.02em'
  				}
  			],
  			'heading-1': [
  				'clamp(1.75rem, 5vw, 2.5rem)',
  				{
  					lineHeight: '1.2',
  					letterSpacing: '-0.01em'
  				}
  			],
  			'heading-2': [
  				'clamp(1.5rem, 4vw, 2rem)',
  				{
  					lineHeight: '1.3'
  				}
  			],
  			'heading-3': [
  				'clamp(1.25rem, 3vw, 1.5rem)',
  				{
  					lineHeight: '1.4'
  				}
  			],
  			'heading-4': [
  				'clamp(1.125rem, 2.5vw, 1.25rem)',
  				{
  					lineHeight: '1.4'
  				}
  			],
  			'body-xl': [
  				'clamp(1.125rem, 2.5vw, 1.25rem)',
  				{
  					lineHeight: '1.6'
  				}
  			],
  			'body-lg': [
  				'clamp(1rem, 2vw, 1.125rem)',
  				{
  					lineHeight: '1.6'
  				}
  			],
  			body: [
  				'clamp(0.875rem, 1.5vw, 1rem)',
  				{
  					lineHeight: '1.6'
  				}
  			],
  			'body-sm': [
  				'clamp(0.8125rem, 1.25vw, 0.875rem)',
  				{
  					lineHeight: '1.5'
  				}
  			],
  			'body-xs': [
  				'clamp(0.75rem, 1vw, 0.8125rem)',
  				{
  					lineHeight: '1.5'
  				}
  			]
  		},
  		spacing: {
  			'section-y': 'clamp(3rem, 8vw, 6rem)',
  			'section-x': 'clamp(1rem, 4vw, 3rem)',
  			'content-gap': 'clamp(1.5rem, 4vw, 3rem)'
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};
export default config;
