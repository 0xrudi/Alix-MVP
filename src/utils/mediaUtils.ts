// src/utils/mediaUtils.ts
import { logger } from './logger';
import { fetchWithCorsProxy, needsCorsProxy } from './corsProxy';

/**
 * Media types that can be detected and processed
 */
export enum MediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  ANIMATION = 'animation',
  ARTICLE = 'article',
  MODEL = '3d',
  UNKNOWN = 'unknown'
}

/**
 * Enhanced media information extracted from NFT metadata
 */
export interface MediaInfo {
  mediaUrl: string | null;
  coverImageUrl: string | null;
  mediaType: MediaType | null; 
  additionalMedia: Record<string, any> | null;
}

/**
 * Extracts media information from NFT metadata
 * Handles various metadata formats and standardizes the output
 */
export const extractMediaInfo = (metadata: any): MediaInfo => {
  try {
    if (!metadata) {
      return {
        mediaUrl: null,
        coverImageUrl: null,
        mediaType: null,
        additionalMedia: null
      };
    }

    // Initialize with null values
    let mediaUrl: string | null = null;
    let coverImageUrl: string | null = null;
    let mediaType: MediaType | null = null;
    const additionalMedia: Record<string, any> = {};

    // Handle string metadata (likely JSON)
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        logger.warn('Failed to parse metadata string as JSON', { 
          error: e, 
          metadata: metadata.substring(0, 100) + '...'
        });
        return {
          mediaUrl: null,
          coverImageUrl: null,
          mediaType: null,
          additionalMedia: null
        };
      }
    }

    // Safe type checking for metadata
    if (typeof metadata === 'object' && metadata !== null) {
      // Handle sound.xyz style metadata
      if ('animation_url' in metadata && typeof metadata.animation_url === 'string') {
        mediaUrl = metadata.animation_url;
        
        // Check mime type to determine media type
        if ('mimeType' in metadata && typeof metadata.mimeType === 'string') {
          if (metadata.mimeType.startsWith('audio/')) {
            mediaType = MediaType.AUDIO;
          } else if (metadata.mimeType.startsWith('video/')) {
            mediaType = MediaType.VIDEO;
          } else {
            mediaType = MediaType.ANIMATION;
          }
        } else {
          // Infer from file extension if mime type is missing
          const extension = getExtensionFromUrl(mediaUrl);
          if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
            mediaType = MediaType.AUDIO;
          } else if (['mp4', 'webm', 'mov'].includes(extension)) {
            mediaType = MediaType.VIDEO;
          } else {
            mediaType = MediaType.ANIMATION;
          }
        }
      } 
      // Handle Mirror.xyz style metadata
      else if ('content' in metadata && typeof metadata.content === 'string') {
        mediaUrl = metadata.content;
        mediaType = MediaType.ARTICLE;
      } 
      // Handle standard NFT image
      else if ('image' in metadata && typeof metadata.image === 'string') {
        mediaUrl = metadata.image;
        mediaType = MediaType.IMAGE;
      }

      // Extract cover image - with priority order
      if ('image' in metadata && typeof metadata.image === 'string') {
        coverImageUrl = metadata.image;
      } else if (
        'artwork' in metadata && 
        typeof metadata.artwork === 'object' && 
        metadata.artwork !== null &&
        'uri' in metadata.artwork && 
        typeof metadata.artwork.uri === 'string'
      ) {
        coverImageUrl = metadata.artwork.uri;
      } else if ('image_url' in metadata && typeof metadata.image_url === 'string') {
        coverImageUrl = metadata.image_url;
      } else if (
        'thumbnail' in metadata && 
        typeof metadata.thumbnail === 'object' && 
        metadata.thumbnail !== null && 
        'uri' in metadata.thumbnail && 
        typeof metadata.thumbnail.uri === 'string'
      ) {
        coverImageUrl = metadata.thumbnail.uri;
      }

      // Collect additional media references for future use
      if ('image_data' in metadata) {
        additionalMedia.image_data = metadata.image_data;
      }
      if ('image_url' in metadata && typeof metadata.image_url === 'string' && 
          (!('image' in metadata) || metadata.image_url !== metadata.image)) {
        additionalMedia.image_url = metadata.image_url;
      }
      if ('external_url' in metadata && typeof metadata.external_url === 'string') {
        additionalMedia.external_url = metadata.external_url;
      }
      if ('animation_url' in metadata && typeof metadata.animation_url === 'string' && 
          metadata.animation_url !== mediaUrl) {
        additionalMedia.animation_url = metadata.animation_url;
      }
      if ('youtube_url' in metadata && typeof metadata.youtube_url === 'string') {
        additionalMedia.youtube_url = metadata.youtube_url;
      }
      if ('properties' in metadata && typeof metadata.properties === 'object' && metadata.properties !== null) {
        // Some NFTs store media info in properties
        additionalMedia.properties = metadata.properties;
      }
    }

    // Convert URIs to full URLs
    if (mediaUrl) mediaUrl = normalizeUri(mediaUrl);
    if (coverImageUrl) coverImageUrl = normalizeUri(coverImageUrl);

    return {
      mediaUrl,
      coverImageUrl,
      mediaType,
      additionalMedia: Object.keys(additionalMedia).length > 0 ? additionalMedia : null
    };
  } catch (error) {
    logger.error('Error extracting media info:', error);
    return {
      mediaUrl: null,
      coverImageUrl: null,
      mediaType: null,
      additionalMedia: null
    };
  }
};

/**
 * Detects media type from a URL by making a HEAD request and checking content-type
 * This is a more accurate but slower method than inferring from extensions
 */
export const detectMediaTypeFromUrl = async (url: string): Promise<MediaType> => {
  try {
    if (!url) return MediaType.UNKNOWN;
    
    // Check extension first for efficiency
    const extension = getExtensionFromUrl(url);
    
    // Handle known extensions
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return MediaType.IMAGE;
    } else if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
      return MediaType.AUDIO;
    } else if (['mp4', 'webm', 'mov'].includes(extension)) {
      return MediaType.VIDEO;
    } else if (['glb', 'gltf'].includes(extension)) {
      return MediaType.MODEL;
    }
    
    // For unknown extensions, make a HEAD request
    const fetchFunc = needsCorsProxy(url) ? fetchWithCorsProxy : fetch;
    const response = await fetchFunc(url, { 
      method: 'HEAD',
      timeout: 5000
    });
    
    if (!response.ok) {
      logger.warn('HEAD request failed for media type detection', { url, status: response.status });
      return MediaType.UNKNOWN;
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType) return MediaType.UNKNOWN;
    
    if (contentType.startsWith('image/')) {
      return MediaType.IMAGE;
    } else if (contentType.startsWith('audio/')) {
      return MediaType.AUDIO;
    } else if (contentType.startsWith('video/')) {
      return MediaType.VIDEO;
    } else if (contentType.includes('application/json') || contentType.includes('text/plain')) {
      return MediaType.ARTICLE;
    } else if (contentType.includes('model/gltf') || contentType.includes('model/gltf-binary')) {
      return MediaType.MODEL;
    }
    
    return MediaType.UNKNOWN;
  } catch (error) {
    logger.error('Error detecting media type from URL:', error);
    return MediaType.UNKNOWN;
  }
};

/**
 * Converts protocol-specific URIs to HTTP URLs
 */
export const normalizeUri = (uri: string): string => {
  if (!uri) return '';
  
  // Handle IPFS URIs
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  // Handle Arweave URIs
  if (uri.startsWith('ar://')) {
    return uri.replace('ar://', 'https://arweave.net/');
  }
  
  return uri;
};

/**
 * Gets file extension from a URL
 */
export const getExtensionFromUrl = (url: string): string => {
  try {
    if (!url) return '';
    
    // Remove query parameters
    const cleanUrl = url.split('?')[0];
    
    // Get the last part of the path
    const parts = cleanUrl.split('/');
    const filename = parts[parts.length - 1];
    
    // Get extension
    const extensionParts = filename.split('.');
    if (extensionParts.length < 2) return '';
    
    return extensionParts[extensionParts.length - 1].toLowerCase();
  } catch (e) {
    return '';
  }
};