export type MessageBlock =
  | { type: "text"; content: string }
  | { type: "question"; questionType: "choice" | "text" | "multi"; text: string; options?: string[]; placeholder?: string }
  | { type: "command"; content: string; label: string }
  | { type: "jb-command"; url: string; component: string; description: string }
  | { type: "code"; language: string; content: string; filename: string }
  | { type: "file"; path: string; content: string }
  | { type: "plan"; title: string; items: PlanItem[] };

export interface PlanItem {
  label: string;
  type: "scaffold" | "jb" | "code";
  command?: string;
}

export function parseAIMessage(raw: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  let remaining = raw;

  while (remaining.length > 0) {
    const tagMatch = remaining.match(/<(question|command|jb-command|code|file|plan)(\s[^>]*)?>/);

    if (!tagMatch) {
      const trimmed = remaining.trim();
      if (trimmed) blocks.push({ type: "text", content: trimmed });
      break;
    }

    const tagStart = tagMatch.index!;
    const tagName = tagMatch[1];
    const tagAttrs = tagMatch[2] || "";

    const textBefore = remaining.slice(0, tagStart).trim();
    if (textBefore) blocks.push({ type: "text", content: textBefore });

    const closeTag = `</${tagName}>`;
    const closeIdx = remaining.indexOf(closeTag, tagStart);
    if (closeIdx === -1) {
      blocks.push({ type: "text", content: remaining.slice(tagStart).trim() });
      break;
    }

    const innerContent = remaining.slice(tagStart + tagMatch[0].length, closeIdx).trim();

    switch (tagName) {
      case "question": {
        const qType = tagAttrs.includes('type="text"')
          ? "text"
          : tagAttrs.includes('type="multi"')
            ? "multi"
            : "choice";

        const optionsMatch = innerContent.match(/OPTIONS:\s*([\s\S]+)/);
        const placeholderMatch = innerContent.match(/PLACEHOLDER:\s*(.+)/);
        const questionText = innerContent
          .replace(/OPTIONS:[\s\S]*$/, "")
          .replace(/PLACEHOLDER:.*$/, "")
          .trim();

        const options = optionsMatch
          ? optionsMatch[1].trim().split("|").map((o) => o.trim()).filter(Boolean)
          : undefined;

        blocks.push({
          type: "question",
          questionType: qType,
          text: questionText,
          options,
          placeholder: placeholderMatch?.[1].trim(),
        });
        break;
      }

      case "command": {
        const labelMatch = tagAttrs.match(/label="([^"]*)"/);
        blocks.push({
          type: "command",
          content: innerContent.trim(),
          label: labelMatch?.[1] || "Terminal",
        });
        break;
      }

      case "jb-command": {
        const compMatch = tagAttrs.match(/component="([^"]*)"/);
        const urlMatch = tagAttrs.match(/url="([^"]*)"/);
        blocks.push({
          type: "jb-command",
          component: compMatch?.[1] || "Component",
          url: urlMatch?.[1] || "",
          description: innerContent.trim(),
        });
        break;
      }

      case "code": {
        const langMatch = tagAttrs.match(/language="([^"]*)"/);
        const fileMatch = tagAttrs.match(/filename="([^"]*)"/);
        blocks.push({
          type: "code",
          language: langMatch?.[1] || "text",
          filename: fileMatch?.[1] || "",
          content: innerContent.trim(),
        });
        break;
      }

      case "file": {
        const pathMatch = tagAttrs.match(/path="([^"]*)"/);
        blocks.push({
          type: "file",
          path: pathMatch?.[1] || "unknown",
          content: innerContent,
        });
        break;
      }

      case "plan": {
        const titleMatch = tagAttrs.match(/title="([^"]*)"/);
        const items: PlanItem[] = innerContent
          .split("\n")
          .filter((line) => line.trim().startsWith("ITEM:"))
          .map((line) => {
            const parts = line.slice(line.indexOf("ITEM:") + 5).split("|").map((p) => p.trim());
            return {
              type: (parts[0] || "code") as PlanItem["type"],
              label: parts[1] || "",
              command: parts[2],
            };
          });
        blocks.push({
          type: "plan",
          title: titleMatch?.[1] || "Build Plan",
          items,
        });
        break;
      }
    }

    remaining = remaining.slice(closeIdx + closeTag.length);
  }

  return blocks;
}
