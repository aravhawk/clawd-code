export interface Session {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  projectPath: string;
  model?: string;
  tokenUsage?: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
  timestamp?: Date;
}

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | {
      type: 'tool_result';
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    }
  | { type: 'image'; source: { type: 'base64' | 'url'; media_type: string; data: string } };

export interface SessionConfig {
  dataDir: string;
  transcriptDir: string;
  compactThreshold: number;
}
