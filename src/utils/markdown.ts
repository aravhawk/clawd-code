/**
 * Markdown parsing and rendering utilities.
 */

export interface MarkdownBlock {
  type: 'text' | 'code' | 'heading' | 'list' | 'blockquote' | 'hr';
  content: string;
  language?: string;
  level?: number;
}

/**
 * Parse markdown into blocks.
 */
export function parseMarkdown(text: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;

      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }

      blocks.push({
        type: 'code',
        content: codeLines.join('\n'),
        language: language || undefined,
      });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        content: headingMatch[2],
        level: headingMatch[1].length,
      });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push({ type: 'hr', content: '' });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push({
        type: 'blockquote',
        content: quoteLines.join('\n'),
      });
      continue;
    }

    // List
    if (/^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
      const listLines: string[] = [];
      while (
        i < lines.length &&
        (/^[-*+]\s/.test(lines[i]) || /^\d+\.\s/.test(lines[i]) || /^\s+/.test(lines[i]))
      ) {
        listLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'list',
        content: listLines.join('\n'),
      });
      continue;
    }

    // Regular text
    if (line.trim()) {
      const textLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].startsWith('#') &&
        !lines[i].startsWith('```') &&
        !lines[i].startsWith('> ')
      ) {
        textLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'text',
        content: textLines.join('\n'),
      });
      continue;
    }

    i++;
  }

  return blocks;
}

/**
 * Strip markdown formatting from text.
 */
export function stripMarkdown(text: string): string {
  return (
    text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`[^`]+`/g, (match) => match.slice(1, -1))
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove emphasis
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
  );
}

/**
 * Extract code blocks from markdown.
 */
export function extractCodeBlocks(text: string): Array<{ language?: string; code: string }> {
  const blocks: Array<{ language?: string; code: string }> = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || undefined,
      code: match[2].trim(),
    });
  }

  return blocks;
}

export default parseMarkdown;
