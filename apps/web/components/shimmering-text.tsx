"use client";

import { cn } from "@/lib/utils";

interface ShimmeringTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function ShimmeringText({
  text,
  className,
  as: Tag = "span",
}: ShimmeringTextProps) {
  return (
    <Tag
      className={cn(
        "inline-block bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer",
        className
      )}
    >
      {text}
    </Tag>
  );
}
