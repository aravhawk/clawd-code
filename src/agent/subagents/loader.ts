import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseSubagent, SubagentConfig } from './base';
import { getStoragePaths } from '../../storage/paths';

export interface CustomSubagentDefinition {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  model?: string;
  maxTokens?: number;
}

/**
 * Loads custom subagent definitions from configuration files.
 */
export class SubagentLoader {
  private customAgents: Map<string, CustomSubagentDefinition> = new Map();
  private loaded: boolean = false;

  /**
   * Load custom subagent definitions from the filesystem.
   */
  async load(): Promise<void> {
    if (this.loaded) return;

    const paths = getStoragePaths();
    const agentPaths = [
      path.join(paths.userConfigDir, 'agents'),
      path.join(paths.projectConfigDir, '.clawd', 'agents'),
    ];

    for (const agentPath of agentPaths) {
      try {
        await this.loadFromDirectory(agentPath);
      } catch {
        // Directory doesn't exist, skip
      }
    }

    this.loaded = true;
  }

  /**
   * Load agents from a directory.
   */
  private async loadFromDirectory(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile()) continue;

        const ext = path.extname(entry.name);
        if (ext !== '.json' && ext !== '.md') continue;

        const filePath = path.join(dir, entry.name);

        try {
          if (ext === '.json') {
            await this.loadJsonAgent(filePath);
          } else if (ext === '.md') {
            await this.loadMarkdownAgent(filePath);
          }
        } catch (error) {
          console.warn(`Failed to load agent from ${filePath}: ${(error as Error).message}`);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  /**
   * Load an agent definition from a JSON file.
   */
  private async loadJsonAgent(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const definition = JSON.parse(content) as CustomSubagentDefinition;

    if (!definition.name || !definition.description || !definition.prompt) {
      throw new Error('Agent definition must have name, description, and prompt');
    }

    this.customAgents.set(definition.name, definition);
  }

  /**
   * Load an agent definition from a Markdown file with frontmatter.
   */
  private async loadMarkdownAgent(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      throw new Error('Invalid agent file format - missing frontmatter');
    }

    const frontmatter = frontmatterMatch[1];
    const prompt = frontmatterMatch[2].trim();

    // Parse YAML-like frontmatter (simple key: value format)
    const metadata: Record<string, string | string[]> = {};
    for (const line of frontmatter.split('\n')) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        // Handle arrays (comma-separated)
        if (value.includes(',')) {
          metadata[key] = value.split(',').map((v) => v.trim());
        } else {
          metadata[key] = value.trim();
        }
      }
    }

    const definition: CustomSubagentDefinition = {
      name: (metadata.name as string) || path.basename(filePath, '.md'),
      description: (metadata.description as string) || 'Custom agent',
      prompt,
      tools: metadata.tools as string[] | undefined,
      model: metadata.model as string | undefined,
      maxTokens: metadata.maxTokens ? parseInt(metadata.maxTokens as string, 10) : undefined,
    };

    this.customAgents.set(definition.name, definition);
  }

  /**
   * Get a custom agent definition by name.
   */
  get(name: string): CustomSubagentDefinition | undefined {
    return this.customAgents.get(name);
  }

  /**
   * Get all custom agent definitions.
   */
  getAll(): CustomSubagentDefinition[] {
    return Array.from(this.customAgents.values());
  }

  /**
   * Check if a custom agent exists.
   */
  has(name: string): boolean {
    return this.customAgents.has(name);
  }

  /**
   * Get available agent names.
   */
  getNames(): string[] {
    return Array.from(this.customAgents.keys());
  }

  /**
   * Reload agents from disk.
   */
  async reload(): Promise<void> {
    this.customAgents.clear();
    this.loaded = false;
    await this.load();
  }
}

// Singleton instance
let loaderInstance: SubagentLoader | null = null;

export function getSubagentLoader(): SubagentLoader {
  if (!loaderInstance) {
    loaderInstance = new SubagentLoader();
  }
  return loaderInstance;
}

export default SubagentLoader;
