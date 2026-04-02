"use client";

const PRESET_PROMPTS = [
  {
    icon: "🛠️",
    label: "SaaS Dashboard",
    description: "Full-stack app with auth",
    prompt:
      "Build a SaaS project management tool where teams can create projects, assign tasks, track progress, and invite team members. Include a landing page, user authentication, and a dashboard.",
    type: "WEB_APP" as const,
  },
  {
    icon: "🛒",
    label: "E-commerce Store",
    description: "Products, cart, checkout",
    prompt:
      "Build an e-commerce store where I can list products with images and prices, customers can browse, add to cart, and pay with DGateway. Include an admin area to manage products and orders.",
    type: "WEB_APP" as const,
  },
  {
    icon: "🌐",
    label: "Agency Website",
    description: "Portfolio + contact form",
    prompt:
      "Build a professional agency website with a hero section, services grid, portfolio/work showcase, team section, testimonials, and a contact form that sends emails.",
    type: "WEBSITE" as const,
  },
  {
    icon: "📊",
    label: "CRM / Client Manager",
    description: "Track clients and deals",
    prompt:
      "Build a CRM tool where I can manage clients, track deals through a pipeline, log interactions, and get a dashboard showing my pipeline value, close rates, and upcoming follow-ups.",
    type: "WEB_APP" as const,
  },
];

interface PresetPromptsProps {
  onSelect: (prompt: string, type: "WEBSITE" | "WEB_APP") => void;
}

export function PresetPrompts({ onSelect }: PresetPromptsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 mb-4">
      {PRESET_PROMPTS.map((preset) => (
        <button
          key={preset.label}
          onClick={() => onSelect(preset.prompt, preset.type)}
          className="text-left p-3.5 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
        >
          <div className="flex items-start gap-2.5">
            <span className="text-xl flex-shrink-0">{preset.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                {preset.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {preset.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
