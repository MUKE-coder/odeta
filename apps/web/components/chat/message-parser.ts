export type MessageBlockType = "text" | "question" | "command" | "jb-command";

export interface MessageBlock {
  type: MessageBlockType;
  content: string;
  options?: string[];
}

/**
 * Parses AI message content containing structured blocks.
 * Supports: <question>, <command>, <jb-command> XML-style blocks.
 */
export function parseAIMessage(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  let remaining = content;

  const patterns = [
    {
      regex: /<question>\s*<text>([\s\S]*?)<\/text>\s*<options>([\s\S]*?)<\/options>\s*<\/question>/g,
      type: "question" as const,
    },
    {
      regex: /<command>([\s\S]*?)<\/command>/g,
      type: "command" as const,
    },
    {
      regex: /<jb-command>([\s\S]*?)<\/jb-command>/g,
      type: "jb-command" as const,
    },
  ];

  // Find all special blocks with their positions
  const found: Array<{ start: number; end: number; block: MessageBlock }> = [];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    const re = new RegExp(pattern.regex.source, "g");
    while ((match = re.exec(content)) !== null) {
      if (pattern.type === "question") {
        found.push({
          start: match.index,
          end: match.index + match[0].length,
          block: {
            type: "question",
            content: match[1].trim(),
            options: match[2].split("|").map((o) => o.trim()),
          },
        });
      } else {
        found.push({
          start: match.index,
          end: match.index + match[0].length,
          block: {
            type: pattern.type,
            content: match[1].trim(),
          },
        });
      }
    }
  }

  if (found.length === 0) {
    return [{ type: "text", content: content.trim() }];
  }

  // Sort by position
  found.sort((a, b) => a.start - b.start);

  let lastEnd = 0;
  for (const item of found) {
    const textBefore = remaining.substring(lastEnd, item.start).trim();
    if (textBefore) {
      blocks.push({ type: "text", content: textBefore });
    }
    blocks.push(item.block);
    lastEnd = item.end;
  }

  const textAfter = remaining.substring(lastEnd).trim();
  if (textAfter) {
    blocks.push({ type: "text", content: textAfter });
  }

  return blocks;
}
