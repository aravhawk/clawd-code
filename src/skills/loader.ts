import { readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { parseSkillFile, type ParsedSkill } from './parser';

export interface SkillLoaderOptions {
  skillsDir?: string;
  recursive?: boolean;
}

export class SkillLoader {
  private skills: Map<string, ParsedSkill> = new Map();
  private skillsDir: string;
  private recursive: boolean;

  constructor(options: SkillLoaderOptions = {}) {
    this.skillsDir = options.skillsDir || '.clawd/skills';
    this.recursive = options.recursive !== false;
  }

  async load(): Promise<void> {
    this.skills.clear();

    try {
      await this.loadDirectory(this.skillsDir);
    } catch (error) {
      // Skills directory might not exist, that's okay
    }
  }

  private async loadDirectory(dir: string): Promise<void> {
    try {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory() && this.recursive) {
          await this.loadDirectory(fullPath);
        } else if (entry.endsWith('.md') || entry.endsWith('.skill')) {
          const skill = parseSkillFile(fullPath);
          if (skill) {
            this.skills.set(skill.frontmatter.name, skill);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or isn't readable
    }
  }

  getSkill(name: string): ParsedSkill | undefined {
    return this.skills.get(name);
  }

  getAllSkills(): ParsedSkill[] {
    return Array.from(this.skills.values());
  }

  getSkillsByCategory(category: string): ParsedSkill[] {
    return this.getAllSkills().filter(
      (s) => s.frontmatter.category === category,
    );
  }

  findSkillByTrigger(input: string): ParsedSkill | undefined {
    for (const skill of this.skills.values()) {
      const trigger = skill.frontmatter.trigger;
      if (trigger && input.toLowerCase().includes(trigger.toLowerCase())) {
        return skill;
      }
    }
    return undefined;
  }

  hasSkill(name: string): boolean {
    return this.skills.has(name);
  }

  getSkillCount(): number {
    return this.skills.size;
  }
}
