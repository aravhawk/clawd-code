import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface SkillFrontmatter {
  name: string;
  description: string;
  trigger?: string;
  category?: string;
  examples?: string[];
}

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  prompt: string;
  filePath: string;
}

export function parseSkillFile(filePath: string): ParsedSkill | null {
  try {
    const content = readFileSync(resolve(filePath), 'utf-8');
    return parseSkillContent(content, filePath);
  } catch (error) {
    return null;
  }
}

export function parseSkillContent(content: string, filePath: string): ParsedSkill | null {
  // Check for YAML frontmatter between --- markers
  const frontmatterRegex = /^---\n([\s\S]+?)\n---\n([\s\S]+)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    // No frontmatter, treat entire content as prompt
    return {
      frontmatter: {
        name: 'Unnamed Skill',
        description: 'A skill without frontmatter',
      },
      prompt: content.trim(),
      filePath,
    };
  }

  const frontmatterYaml = match[1];
  const prompt = match[2].trim();

  // Parse YAML frontmatter (simple implementation)
  const frontmatter = parseYamlFrontmatter(frontmatterYaml);

  return {
    frontmatter,
    prompt,
    filePath,
  };
}

function parseYamlFrontmatter(yaml: string): SkillFrontmatter {
  const lines = yaml.split('\n');
  const result: any = {};

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Handle array values
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim().replace(/^['"]|['"]$/g, ''));
    }

    // Remove quotes from string values
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    } else if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return {
    name: result.name || 'Unnamed Skill',
    description: result.description || 'No description',
    trigger: result.trigger,
    category: result.category,
    examples: Array.isArray(result.examples) ? result.examples : undefined,
  };
}
