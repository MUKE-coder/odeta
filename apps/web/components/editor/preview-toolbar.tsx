"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Monitor, RotateCw, Smartphone, Tablet } from "lucide-react";

const DEVICES = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "100%", height: "100%" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "768px", height: "1024px" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "390px", height: "844px" },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

interface PreviewToolbarProps {
  url?: string;
  activeDevice: DeviceId;
  onDeviceChange: (device: DeviceId) => void;
}

export function PreviewToolbar({ url, activeDevice, onDeviceChange }: PreviewToolbarProps) {
  const [isRotated, setIsRotated] = useState(false);
  const device = DEVICES.find((d) => d.id === activeDevice)!;

  const w = isRotated && activeDevice !== "desktop" ? device.height : device.width;
  const h = isRotated && activeDevice !== "desktop" ? device.width : device.height;

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b bg-white">
      <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
        {DEVICES.map((d) => {
          const Icon = d.icon;
          return (
            <button
              key={d.id}
              onClick={() => onDeviceChange(d.id)}
              title={d.label}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                activeDevice === d.id
                  ? "bg-white text-foreground shadow-sm"
                  : "text-text-tertiary hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>

      <span className="text-[10px] text-text-tertiary font-mono">{w} × {h}</span>

      <div className="flex items-center gap-1">
        {activeDevice !== "desktop" && (
          <button
            onClick={() => setIsRotated((r) => !r)}
            className="p-1 text-text-tertiary hover:text-foreground rounded hover:bg-gray-100"
            title="Rotate"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        )}
        {url && (
          <button
            onClick={() => window.open(url, "_blank")}
            className="p-1 text-text-tertiary hover:text-foreground rounded hover:bg-gray-100"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export type { DeviceId };
export { DEVICES };
