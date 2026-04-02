export type MessageBlock =
  | { type: "text"; content: string }
  | { type: "question"; text: string; options: string[] }
  | { type: "command"; content: string; label: string }
  | { type: "jb-command"; url: string; component: string; description: string }
  | { type: "code"; language: string; content: string; filename: string }
  | { type: "plan"; title: string; items: PlanItem[] };

export interface PlanItem {
  label: string;
  type: "grit" | "jb" | "code";
  command?: string;
}

interface FoundBlock {
  start: number;
  end: number;
  block: MessageBlock;
}

export function parseAIMessage(raw: string): MessageBlock[] {
  const found: FoundBlock[] = [];

  // Parse <question> blocks
  const questionRe =
    /<question>\s*([\s\S]*?)\s*OPTIONS:\s*([\s\S]*?)\s*<\/question>/g;
  let m: RegExpExecArray | null;
  while ((m = questionRe.exec(raw)) !== null) {
    found.push({
      start: m.index,
      end: m.index + m[0].length,
      block: {
        type: "question",
        text: m[1].trim(),
        options: m[2].split("|").map((o) => o.trim()),
      },
    });
  }

  // Parse <command> blocks
  const commandRe =
    /<command(?:\s+label="([^"]*)")?\s*>\s*([\s\S]*?)\s*<\/command>/g;
  while ((m = commandRe.exec(raw)) !== null) {
    found.push({
      start: m.index,
      end: m.index + m[0].length,
      block: {
        type: "command",
        label: m[1] || "Terminal",
        content: m[2].trim(),
      },
    });
  }

  // Parse <jb-command> blocks
  const jbRe =
    /<jb-command(?:\s+component="([^"]*)")?(?:\s+url="([^"]*)")?\s*>\s*([\s\S]*?)\s*<\/jb-command>/g;
  while ((m = jbRe.exec(raw)) !== null) {
    found.push({
      start: m.index,
      end: m.index + m[0].length,
      block: {
        type: "jb-command",
        component: m[1] || "Component",
        url: m[2] || "",
        description: m[3].trim(),
      },
    });
  }

  // Parse <code> blocks
  const codeRe =
    /<code(?:\s+language="([^"]*)")?(?:\s+filename="([^"]*)")?\s*>\s*([\s\S]*?)\s*<\/code>/g;
  while ((m = codeRe.exec(raw)) !== null) {
    found.push({
      start: m.index,
      end: m.index + m[0].length,
      block: {
        type: "code",
        language: m[1] || "text",
        filename: m[2] || "",
        content: m[3].trim(),
      },
    });
  }

  // Parse <plan> blocks
  const planRe = /<plan(?:\s+title="([^"]*)")?\s*>\s*([\s\S]*?)\s*<\/plan>/g;
  while ((m = planRe.exec(raw)) !== null) {
    const items: PlanItem[] = [];
    const itemRe = /ITEM:\s*(grit|jb|code)\|(.*?)\|(.*)/g;
    let im: RegExpExecArray | null;
    while ((im = itemRe.exec(m[2])) !== null) {
      items.push({
        type: im[1] as PlanItem["type"],
        label: im[2].trim(),
        command: im[3].trim(),
      });
    }
    found.push({
      start: m.index,
      end: m.index + m[0].length,
      block: {
        type: "plan",
        title: m[1] || "Build Plan",
        items,
      },
    });
  }

  if (found.length === 0) {
    const trimmed = raw.trim();
    return trimmed ? [{ type: "text", content: trimmed }] : [];
  }

  found.sort((a, b) => a.start - b.start);

  const blocks: MessageBlock[] = [];
  let lastEnd = 0;

  for (const item of found) {
    const textBefore = raw.substring(lastEnd, item.start).trim();
    if (textBefore) {
      blocks.push({ type: "text", content: textBefore });
    }
    blocks.push(item.block);
    lastEnd = item.end;
  }

  const textAfter = raw.substring(lastEnd).trim();
  if (textAfter) {
    blocks.push({ type: "text", content: textAfter });
  }

  return blocks;
}
