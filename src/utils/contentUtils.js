// src/utils/contentUtils.js
import { logger } from './logger';

/**
 * Parses and processes different types of content to determine if and how it should be rendered
 * @param {string|object} content - The content to parse
 * @returns {Promise<string|null>} The processed content ready for markdown rendering
 */
export const parseContent = async (content) => {
  logger.debug('parseContent: Initial Input', {
    type: typeof content,
    value: content,
    isArweave: typeof content === 'string' && content.startsWith('ar://'),
    isObject: typeof content === 'object' && content !== null
  });

  try {
    // Early return if no content provided
    if (!content) {
      logger.debug('parseContent: No content provided', null);
      return null;
    }

    // Handle Arweave URI content
    if (typeof content === 'string' && content.startsWith('ar://')) {
      logger.debug('parseContent: Processing Arweave URI', content);
      const arweaveId = content.replace('ar://', '');
      const arweaveUrl = `https://arweave.net/${arweaveId}`;
      
      try {
        const response = await fetch(arweaveUrl);
        if (!response.ok) {
          throw new Error(`Arweave fetch failed: ${response.status}`);
        }
        
        const arweaveContent = await response.json();
        logger.debug('parseContent: Retrieved Arweave content', arweaveContent);

        // Handle Mirror.xyz style content structure
        if (arweaveContent.content?.body) {
          return arweaveContent.content.body;
        }
        
        // Handle direct content in Arweave response
        if (arweaveContent.body) {
          return arweaveContent.body;
        }

        // Handle content field variations
        if (arweaveContent.text || arweaveContent.content) {
          return arweaveContent.text || arweaveContent.content;
        }

        // If no recognizable structure, return the whole content
        return JSON.stringify(arweaveContent, null, 2);
      } catch (error) {
        logger.error('Error fetching Arweave content:', error);
        return null;
      }
    }

    // Handle object content (non-Arweave)
    if (typeof content === 'object' && content !== null) {
      if (content.content?.body) {
        return content.content.body;
      }
      if (content.body) {
        return content.body;
      }
      if (content.text || content.content) {
        return content.text || content.content;
      }
      return JSON.stringify(content, null, 2);
    }

    // Handle string content (non-Arweave)
    if (typeof content === 'string') {
      const markdownIndicators = [
        '#',        // Headers
        '-',        // Lists or horizontal rules
        '*',        // Emphasis or lists
        '```',      // Code blocks
        '>',        // Blockquotes
        '[',        // Links
        '|',        // Tables
        '1.',       // Numbered lists
        '<http',    // HTML-style links
        '![',       // Images
        '**',       // Bold text
        '_',        // Italic text
        '- [ ]',    // Task lists
        '```js',    // Code blocks with language
        '~~~'       // Alternative code blocks
      ];

      const foundIndicators = markdownIndicators.filter(indicator => 
        content.includes(indicator)
      );

      // If any markdown indicators are found, treat as markdown
      if (foundIndicators.length > 0) {
        logger.debug('parseContent: Identified as markdown', {
          indicators: foundIndicators
        });
        return content;
      }
    }

    // If no markdown content detected, return as-is
    return content;
  } catch (error) {
    logger.error('Error parsing content:', error);
    return null;
  }
};