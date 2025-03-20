// src/utils/corsProxy.js
import { logger } from './logger';

/**
 * CORS Proxy implementation for accessing content blocked by CORS restrictions
 * This utility helps retrieve image and metadata from services that don't support CORS
 */

// List of known CORS-problematic domains
const CORS_RESTRICTED_DOMAINS = [
  'ipfs.io',
  'nftstorage.link', 
  'arweave.net',
  'gateway.pinata.cloud',
  'apymon.com',
  'stoneysociety.io',
  'gateway.ipfs.io',
  'cloudflare-ipfs.com',
  'app.unlock-protocol.com',
  'ipfs.nftstorage.link'
];

// Public CORS proxies that can be used (in order of preference)
const CORS_PROXIES = [
  'https://proxy.cors.sh/',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
];

// Cache successful proxy results to improve performance
const proxyCache = new Map();

/**
 * Determines if a URL is from a domain that typically has CORS issues
 * @param {string} url - The URL to check
 * @returns {boolean} True if the URL is from a domain with known CORS issues
 */
export const needsCorsProxy = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Handle ipfs:// and ar:// protocols directly
    if (url.startsWith('ipfs://') || url.startsWith('ar://')) return true;
    
    const urlObj = new URL(url);
    return CORS_RESTRICTED_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch (error) {
    logger.warn('Error checking URL for CORS proxy need:', { url, error: error.message });
    return false;
  }
};

/**
 * Applies a CORS proxy to a URL if needed
 * @param {string} url - The original URL
 * @param {number} proxyIndex - Index of the proxy to use (for fallback logic)
 * @returns {string} URL with proxy applied if needed
 */
export const applyCorsProxy = (url, proxyIndex = 0) => {
  if (!url || typeof url !== 'string') return url;
  
  // Check cache first to avoid redundant proxy requests
  const cacheKey = `${url}-${proxyIndex}`;
  if (proxyCache.has(cacheKey)) {
    return proxyCache.get(cacheKey);
  }
  
  try {
    // Handle data URLs - no proxy needed
    if (url.startsWith('data:')) {
      return url;
    }
    
    // Handle ar:// protocol
    if (url.startsWith('ar://')) {
      const arweaveHash = url.replace('ar://', '');
      const directGatewayUrl = `https://arweave.net/${arweaveHash}`;
      const proxiedUrl = `${CORS_PROXIES[proxyIndex % CORS_PROXIES.length]}${directGatewayUrl}`;
      proxyCache.set(cacheKey, proxiedUrl);
      return proxiedUrl;
    }
    
    // Handle ipfs:// protocol
    if (url.startsWith('ipfs://')) {
      const ipfsHash = url.replace('ipfs://', '');
      const directGatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      const proxiedUrl = `${CORS_PROXIES[proxyIndex % CORS_PROXIES.length]}${directGatewayUrl}`;
      proxyCache.set(cacheKey, proxiedUrl);
      return proxiedUrl;
    }
    
    // Handle normal http/https URLs
    if (needsCorsProxy(url)) {
      const proxiedUrl = `${CORS_PROXIES[proxyIndex % CORS_PROXIES.length]}${url}`;
      proxyCache.set(cacheKey, proxiedUrl);
      return proxiedUrl;
    }
    
    return url;
  } catch (error) {
    logger.error('Error applying CORS proxy:', { url, error: error.message });
    return url;
  }
};

/**
 * Creates direct gateway URLs without using a proxy
 * @param {string} url - The original URL to convert
 * @returns {string} Direct gateway URL
 */
export const createDirectGatewayUrl = (url) => {
  if (!url) return null;
  
  try {
    // Handle ar:// protocol
    if (url.startsWith('ar://')) {
      const hash = url.replace('ar://', '');
      return `https://arweave.net/${hash}`;
    }
    
    // Handle ipfs:// protocol
    if (url.startsWith('ipfs://')) {
      const hash = url.replace('ipfs://', '');
      return `https://ipfs.io/ipfs/${hash}`;
    }
    
    // Handle URLs with /ipfs/ path
    if (url.includes('/ipfs/')) {
      const parts = url.split('/ipfs/');
      if (parts.length >= 2) {
        const hash = parts[1].split('/')[0];
        return `https://ipfs.io/ipfs/${hash}`;
      }
    }
    
    return url;
  } catch (error) {
    logger.error('Error creating direct gateway URL:', error);
    return url;
  }
};

/**
 * Fetches content through a CORS proxy with improved fallback logic
 * @param {string} url - The original URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const fetchWithCorsProxy = async (url, options = {}) => {
  if (!url) throw new Error('URL is required');
  
  // Convert protocol URLs to gateway URLs first
  let gatewayUrl = url;
  if (url.startsWith('ar://') || url.startsWith('ipfs://')) {
    gatewayUrl = createDirectGatewayUrl(url);
    logger.debug('Converted protocol URL to gateway URL:', { original: url, gateway: gatewayUrl });
  }
  
  // Try direct fetch first if it's not a known CORS-restricted domain
  if (!needsCorsProxy(gatewayUrl)) {
    try {
      logger.debug('Attempting direct fetch first:', gatewayUrl);
      const response = await fetch(gatewayUrl, {
        ...options,
        mode: 'cors',
        headers: {
          ...options.headers,
          'Accept': 'application/json, image/*, audio/*, video/*, */*'
        }
      });
      
      if (response.ok) {
        logger.debug('Direct fetch successful:', gatewayUrl);
        return response;
      }
    } catch (error) {
      logger.debug('Direct fetch failed, trying with proxy:', { 
        url: gatewayUrl, 
        error: error.message 
      });
      // Continue to proxy attempts
    }
  }
  
  let lastError = null;
  
  // Try with each proxy until one works
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxiedUrl = applyCorsProxy(gatewayUrl, i);
      logger.debug(`Trying proxy ${i+1}/${CORS_PROXIES.length}:`, { 
        originalUrl: gatewayUrl, 
        proxiedUrl 
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
      
      const response = await fetch(proxiedUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Accept': 'application/json, image/*, audio/*, video/*, */*'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        logger.debug(`Proxy ${i+1} successful:`, { url: gatewayUrl, proxy: CORS_PROXIES[i] });
        return response;
      } else {
        throw new Error(`Proxy returned status ${response.status}`);
      }
    } catch (error) {
      logger.warn(`Proxy attempt ${i+1} failed:`, { 
        url: gatewayUrl, 
        proxy: CORS_PROXIES[i], 
        error: error.message 
      });
      lastError = error;
      // Continue to the next proxy
    }
  }
  
  // Last resort - try with no-cors mode
  // This will give us limited access but might be better than nothing
  logger.debug('All proxies failed, trying no-cors mode as last resort');
  try {
    logger.debug('All proxies failed, returning gateway URL for direct client handling:', gatewayUrl);
    const response = await fetch(gatewayUrl, {
      ...options,
      mode: 'no-cors',
      headers: {
        ...options.headers,
        'Accept': 'application/json, image/*, audio/*, video/*, */*'
      }
    });
    
    // With no-cors mode, we can't check status or read content normally,
    // but we can return the response for handling by the caller
    return response;
  } catch (finalError) {
    logger.error('Final no-cors attempt failed:', finalError);
    // If all else fails, throw the last proxy error
    throw lastError || new Error(`All CORS proxies failed for URL: ${gatewayUrl}`);
  }
};

/**
 * Creates a URL object that can be used directly in media elements,
 * bypassing CORS restrictions for audio/video playback
 * @param {string} url - The URL to process
 * @returns {string} - A URL that can be used in audio/video elements
 */
export const createMediaUrl = (url) => {
  if (!url) return '';
  
  try {
    // For ar:// and ipfs:// protocols, convert to direct gateway URLs
    if (url.startsWith('ar://') || url.startsWith('ipfs://')) {
      return createDirectGatewayUrl(url);
    }
    
    // For HTTP URLs, return as is - HTML media elements handle CORS differently
    return url;
  } catch (error) {
    logger.error('Error creating media URL:', error);
    return url;
  }
};

/**
 * Specifically fetch Arweave content with special handling for CORS and errors
 * @param {string} url - The Arweave URL (can be ar:// protocol or direct https://arweave.net/...)
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - The parsed JSON response or error object
 */
export const fetchArweaveContent = async (url, options = {}) => {
    if (!url) {
      return { error: 'No URL provided' };
    }
    
    try {
      // Convert ar:// protocol to direct URL if needed
      let arweaveUrl = url;
      if (url.startsWith('ar://')) {
        arweaveUrl = createDirectGatewayUrl(url);
      }
      
      logger.debug('Fetching Arweave content:', arweaveUrl);
      
      // Try to fetch using our proxy mechanism
      const response = await fetchWithCorsProxy(arweaveUrl, {
        ...options,
        timeout: options.timeout || 15000, // Extend timeout for Arweave
        headers: {
          ...options.headers,
          'Accept': 'application/json, */*'
        }
      });
      
      // If response is in no-cors mode, we can't access the content
      // This happens when all proxies fail and we fall back to direct access
      if (response.type === 'opaque') {
        return { 
          error: 'CORS restriction prevented content access', 
          url: arweaveUrl,
          directAccess: true
        };
      }
      
      // Handle JSON responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { data };
      }
      
      // Handle text responses
      const text = await response.text();
      
      // Try to parse as JSON even if content-type is not set correctly
      try {
        const data = JSON.parse(text);
        return { data };
      } catch (parseError) {
        // If not JSON, return as text
        return { data: { text } };
      }
    } catch (error) {
      logger.error('Error fetching Arweave content:', { url, error: error.message });
      return { 
        error: error.message || 'Failed to fetch Arweave content',
        url,
        directAccess: true
      };
    }
};