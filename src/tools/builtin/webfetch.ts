import { BaseTool, ToolResult } from '../base.js';
import { Logger } from '../../utils/logger.js';

const log = Logger.create('WebFetch');

interface WebFetchInput {
  url: string;
  format?: 'text' | 'markdown' | 'html';
  timeout?: number;
}

export class WebFetchTool extends BaseTool {
  name = 'WebFetch';
  description = `Fetches content from a URL and returns it in the requested format. 
Use this tool to retrieve web content, documentation, or API responses.
HTTP URLs are automatically upgraded to HTTPS. Results may be truncated if content is very large.`;

  inputSchema = {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch content from (must be fully-formed)',
      },
      format: {
        type: 'string',
        enum: ['text', 'markdown', 'html'],
        description: 'Format to return content in (default: markdown)',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in seconds (max 120, default: 30)',
      },
    },
    required: ['url'],
  };

  async execute(input: unknown): Promise<ToolResult> {
    this.validateInput(input);
    const { url, format = 'markdown', timeout = 30 } = input as WebFetchInput;

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return {
        success: false,
        content: `Invalid URL: ${url}`,
      };
    }

    // Upgrade HTTP to HTTPS
    if (parsedUrl.protocol === 'http:') {
      parsedUrl.protocol = 'https:';
      log.info(`Upgraded URL to HTTPS: ${parsedUrl.href}`);
    }

    // Validate protocol
    if (parsedUrl.protocol !== 'https:') {
      return {
        success: false,
        content: `Unsupported protocol: ${parsedUrl.protocol}. Only HTTPS is supported.`,
      };
    }

    // Enforce timeout limits
    const effectiveTimeout = Math.min(Math.max(timeout, 5), 120) * 1000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

      const response = await fetch(parsedUrl.href, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'clawd-code/1.0.0 (CLI agent)',
          Accept: this.getAcceptHeader(format),
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      // Handle redirects to different hosts
      const finalUrl = response.url;
      const finalHost = new URL(finalUrl).host;
      const originalHost = parsedUrl.host;

      if (finalHost !== originalHost) {
        return {
          success: true,
          content: `Redirected to different host: ${finalUrl}. Please make a new request with this URL.`,
          metadata: {
            redirectUrl: finalUrl,
            originalUrl: parsedUrl.href,
          },
        };
      }

      if (!response.ok) {
        return {
          success: false,
          content: `HTTP ${response.status}: ${response.statusText}`,
          metadata: {
            status: response.status,
            statusText: response.statusText,
          },
        };
      }

      const contentType = response.headers.get('content-type') || '';
      let content = await response.text();

      // Convert content based on format
      if (format === 'text') {
        content = this.htmlToText(content);
      } else if (format === 'markdown' && contentType.includes('text/html')) {
        content = this.htmlToMarkdown(content);
      }

      // Truncate if too large
      const MAX_LENGTH = 100000;
      const truncated = content.length > MAX_LENGTH;
      if (truncated) {
        content = content.slice(0, MAX_LENGTH) + '\n\n[Content truncated]';
      }

      return {
        success: true,
        content,
        metadata: {
          url: finalUrl,
          contentType,
          contentLength: content.length,
          truncated,
        },
      };
    } catch (error) {
      const err = error as Error;

      if (err.name === 'AbortError') {
        return {
          success: false,
          content: `Request timed out after ${timeout} seconds`,
        };
      }

      log.error('WebFetch error:', err);
      return {
        success: false,
        content: `Fetch failed: ${err.message}`,
      };
    }
  }

  private getAcceptHeader(format: string): string {
    switch (format) {
      case 'html':
        return 'text/html';
      case 'text':
        return 'text/plain, text/html';
      case 'markdown':
      default:
        return 'text/html, text/plain, application/json';
    }
  }

  private htmlToText(html: string): string {
    // Basic HTML to text conversion
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private htmlToMarkdown(html: string): string {
    // Basic HTML to Markdown conversion
    let md = html
      // Remove scripts and styles
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n')
      // Links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      // Bold and italic
      .replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, '**$2**')
      .replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, '*$2*')
      // Code
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '\n```\n$1\n```\n')
      // Lists
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<\/?[uo]l[^>]*>/gi, '\n')
      // Paragraphs and breaks
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      // Remove remaining tags
      .replace(/<[^>]+>/g, '')
      // Decode entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return md;
  }
}
