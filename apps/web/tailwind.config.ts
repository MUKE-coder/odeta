import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", "class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'var(--bg-primary)',
  			'bg-secondary': 'var(--bg-secondary)',
  			'bg-tertiary': 'var(--bg-tertiary)',
  			'bg-elevated': 'var(--bg-elevated)',
  			'bg-hover': 'var(--bg-hover)',
  			border: 'var(--border)',
  			foreground: 'var(--text-primary)',
  			'text-secondary': 'var(--text-secondary)',
  			'text-muted': 'var(--text-muted)',
  			accent: {
  				DEFAULT: 'var(--accent)',
  				hover: 'var(--accent-hover)'
  			},
  			success: 'var(--success)',
  			danger: 'var(--danger)',
  			warning: 'var(--warning)',
  			info: 'var(--info)',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-onest)',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'var(--font-jetbrains-mono)',
  				'ui-monospace',
  				'monospace'
  			]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
