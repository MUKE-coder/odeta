export interface Theme {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: {
    bg: string;
    surface: string;
    border: string;
    text: string;
    accent: string;
    radius: string;
  };
}

export const THEMES: Theme[] = [
  // Minimal
  { id: "clean", name: "Clean", category: "minimal", description: "Pure white, no frills. Every pixel earned.", preview: { bg: "#ffffff", surface: "#f9fafb", border: "#e5e7eb", text: "#111827", accent: "#2563eb", radius: "8px" } },
  { id: "ghost", name: "Ghost", category: "minimal", description: "Almost invisible borders. Lots of breathing room.", preview: { bg: "#fafafa", surface: "#ffffff", border: "#f0f0f0", text: "#1a1a1a", accent: "#000000", radius: "12px" } },
  { id: "linen", name: "Linen", category: "minimal", description: "Warm off-white. Feels handcrafted and calm.", preview: { bg: "#faf8f5", surface: "#f5f0ea", border: "#e8e0d5", text: "#2c2416", accent: "#8b6f47", radius: "8px" } },
  // Bold
  { id: "midnight", name: "Midnight", category: "bold", description: "Deep navy with electric accents.", preview: { bg: "#0f172a", surface: "#1e293b", border: "#334155", text: "#f8fafc", accent: "#6366f1", radius: "12px" } },
  { id: "obsidian", name: "Obsidian", category: "bold", description: "Pure black. High contrast. Zero compromise.", preview: { bg: "#000000", surface: "#111111", border: "#222222", text: "#ffffff", accent: "#ffffff", radius: "4px" } },
  { id: "aurora", name: "Aurora", category: "bold", description: "Dark with green northern light accents.", preview: { bg: "#0a0f0a", surface: "#0f1a0f", border: "#1a2e1a", text: "#e8f5e9", accent: "#4ade80", radius: "12px" } },
  { id: "ink", name: "Ink", category: "bold", description: "Dark charcoal with amber warmth.", preview: { bg: "#1c1917", surface: "#292524", border: "#44403c", text: "#fafaf9", accent: "#f59e0b", radius: "8px" } },
  // Glass
  { id: "frost", name: "Frost", category: "glass", description: "Translucent cards, modern iOS feel.", preview: { bg: "#e8f4fd", surface: "#ffffff", border: "#d4e8f7", text: "#1e3a5f", accent: "#0ea5e9", radius: "16px" } },
  { id: "neon", name: "Neon", category: "glass", description: "Dark glass with glowing neon accents.", preview: { bg: "#050510", surface: "#0f0f1a", border: "#2a1f5e", text: "#e2e8f0", accent: "#a855f7", radius: "12px" } },
  // Editorial
  { id: "broadsheet", name: "Broadsheet", category: "editorial", description: "Serif headings, like a premium magazine.", preview: { bg: "#fffef9", surface: "#faf9f0", border: "#d4c89a", text: "#1a180e", accent: "#8b1a1a", radius: "0px" } },
  { id: "notebook", name: "Notebook", category: "editorial", description: "Ruled lines, pencil-thin borders.", preview: { bg: "#fefce8", surface: "#fef9c3", border: "#fde68a", text: "#1c1917", accent: "#78350f", radius: "4px" } },
  { id: "paper", name: "Paper", category: "editorial", description: "Off-white and tactile. Content-first.", preview: { bg: "#f8f5f0", surface: "#ffffff", border: "#e2d9cf", text: "#2d2926", accent: "#5c4033", radius: "6px" } },
  // Retro
  { id: "terminal", name: "Terminal", category: "retro", description: "Green on black. Pure developer nostalgia.", preview: { bg: "#001100", surface: "#002200", border: "#003300", text: "#00ff41", accent: "#00ff41", radius: "0px" } },
  { id: "brutalist", name: "Brutalist", category: "retro", description: "Black borders, raw honesty. No decoration.", preview: { bg: "#ffffff", surface: "#ffffff", border: "#000000", text: "#000000", accent: "#000000", radius: "0px" } },
  // Playful
  { id: "candy", name: "Candy", category: "playful", description: "Pastel gradients and rounded corners.", preview: { bg: "#fdf2f8", surface: "#fce7f3", border: "#f9a8d4", text: "#500724", accent: "#db2777", radius: "24px" } },
  { id: "sunrise", name: "Sunrise", category: "playful", description: "Warm orange and yellow. Optimistic.", preview: { bg: "#fffbeb", surface: "#fef3c7", border: "#fcd34d", text: "#451a03", accent: "#f97316", radius: "16px" } },
  // Corporate
  { id: "enterprise", name: "Enterprise", category: "corporate", description: "Navy and gray. Boardroom-ready.", preview: { bg: "#f8fafc", surface: "#ffffff", border: "#e2e8f0", text: "#0f172a", accent: "#1d4ed8", radius: "6px" } },
  { id: "sage", name: "Sage", category: "corporate", description: "Muted greens and warm grays.", preview: { bg: "#f8faf8", surface: "#ffffff", border: "#d1d5d1", text: "#1a2414", accent: "#16783a", radius: "8px" } },
  { id: "slate-pro", name: "Slate Pro", category: "corporate", description: "Cool grays with purple accents.", preview: { bg: "#f8fafc", surface: "#ffffff", border: "#e2e8f0", text: "#0f172a", accent: "#7c3aed", radius: "12px" } },
  { id: "coral", name: "Coral", category: "playful", description: "Warm coral tones. Friendly and inviting.", preview: { bg: "#fff5f5", surface: "#fed7d7", border: "#feb2b2", text: "#63171b", accent: "#e53e3e", radius: "12px" } },
];

export const THEME_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "minimal", label: "Minimal" },
  { id: "bold", label: "Bold & Dark" },
  { id: "glass", label: "Glass" },
  { id: "editorial", label: "Editorial" },
  { id: "retro", label: "Retro" },
  { id: "playful", label: "Playful" },
  { id: "corporate", label: "Corporate" },
];

export const FONT_PAIRINGS = [
  { id: "inter", name: "Inter", label: "Clean & Modern", description: "Ultra-readable, widely loved.", popular: true },
  { id: "geist", name: "Geist", label: "Developer-friendly", description: "Vercel's typeface. Technical and refined." },
  { id: "cal-sans", name: "Cal Sans + Inter", label: "SaaS Classic", description: "Cal.com's signature. Warm heading, clean body." },
  { id: "playfair", name: "Playfair + DM Sans", label: "Editorial", description: "Elegant. Great for agencies and portfolios." },
  { id: "sora", name: "Sora", label: "Futuristic", description: "Geometric and modern. Perfect for tech." },
  { id: "space-grotesk", name: "Space Grotesk + Nunito", label: "Friendly Tech", description: "Approachable but technical." },
  { id: "dm-serif", name: "DM Serif + DM Sans", label: "Professional", description: "Authoritative. Great for B2B tools." },
  { id: "fraunces", name: "Fraunces + Manrope", label: "Expressive", description: "Bold personality. Stands out immediately." },
];

export const COLOR_PALETTES = [
  { id: "blue", name: "Ocean", primary: "#2563eb", preview: ["#2563eb", "#3b82f6", "#93c5fd", "#dbeafe"] },
  { id: "violet", name: "Violet", primary: "#7c3aed", preview: ["#7c3aed", "#8b5cf6", "#c4b5fd", "#ede9fe"] },
  { id: "rose", name: "Rose", primary: "#e11d48", preview: ["#e11d48", "#f43f5e", "#fda4af", "#ffe4e6"] },
  { id: "emerald", name: "Emerald", primary: "#059669", preview: ["#059669", "#10b981", "#6ee7b7", "#d1fae5"] },
  { id: "amber", name: "Amber", primary: "#d97706", preview: ["#d97706", "#f59e0b", "#fcd34d", "#fef3c7"] },
  { id: "slate", name: "Slate", primary: "#475569", preview: ["#475569", "#64748b", "#cbd5e1", "#f1f5f9"] },
  { id: "cyan", name: "Cyan", primary: "#0891b2", preview: ["#0891b2", "#06b6d4", "#67e8f9", "#cffafe"] },
  { id: "orange", name: "Orange", primary: "#ea580c", preview: ["#ea580c", "#f97316", "#fdba74", "#ffedd5"] },
  { id: "pink", name: "Pink", primary: "#db2777", preview: ["#db2777", "#ec4899", "#f9a8d4", "#fce7f3"] },
  { id: "teal", name: "Teal", primary: "#0d9488", preview: ["#0d9488", "#14b8a6", "#5eead4", "#ccfbf1"] },
  { id: "indigo", name: "Indigo", primary: "#4338ca", preview: ["#4338ca", "#6366f1", "#a5b4fc", "#e0e7ff"] },
  { id: "lime", name: "Lime", primary: "#65a30d", preview: ["#65a30d", "#84cc16", "#bef264", "#ecfccb"] },
];
