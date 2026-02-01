/**
 * Built-in skills for Clawd Code.
 */

import type { Skill } from '../parser';

/**
 * Frontend design skill for creating UI components.
 */
export const frontendDesignSkill: Skill = {
  name: 'frontend-design',
  description: 'Create distinctive, production-grade frontend interfaces with high design quality',
  version: '1.0.0',
  content: `You are an expert frontend designer creating a {{component_type}}.

Design Guidelines:
- Create distinctive, bespoke designs that avoid generic templates
- Use proper semantic HTML and accessibility best practices
- Implement smooth micro-interactions and animations
- Ensure responsive design across all breakpoints
- Follow the principle of intentional minimalism

Requirements:
{{requirements}}

Please create a complete, production-ready implementation.`,
  systemPrompt: `You are a Senior Frontend Architect with 15+ years of experience. Master of visual hierarchy, whitespace, and UX engineering. Your designs are avant-garde yet functional.`,
  tags: ['frontend', 'design', 'ui', 'ux'],
  author: 'Clawd Code',
};

/**
 * Code review skill for analyzing code quality.
 */
export const codeReviewSkill: Skill = {
  name: 'code-review',
  description: 'Perform thorough code review with focus on quality, security, and best practices',
  version: '1.0.0',
  content: `Review the following code:

\`\`\`{{language}}
{{code}}
\`\`\`

Please analyze this code for:
1. Code quality and readability
2. Potential bugs or edge cases
3. Security vulnerabilities
4. Performance implications
5. Adherence to best practices
6. Suggestions for improvement

Provide specific, actionable feedback with code examples where helpful.`,
  systemPrompt: `You are an expert code reviewer with deep knowledge of software engineering best practices. Be thorough but constructive.`,
  tags: ['review', 'quality', 'security'],
  author: 'Clawd Code',
};

/**
 * All built-in skills.
 */
export const builtinSkills: Skill[] = [frontendDesignSkill, codeReviewSkill];

/**
 * Get a built-in skill by name.
 */
export function getBuiltinSkill(name: string): Skill | undefined {
  return builtinSkills.find((skill) => skill.name === name);
}

export default builtinSkills;
