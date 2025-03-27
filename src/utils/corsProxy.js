// src/utils/corsProxy.js
import { logger } from './logger';

/**
 * CORS Proxy implementation for accessing content blocked by CORS restrictions
 * This utility helps retrieve image and metadata from services that don't support CORS
 */

// Get the CORS API key from environment variables
const CORS_API_KEY = process.env.REACT_APP_CORS_API_KEY;

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

// CORS.sh configuration with API key from environment
const CORS_SH_CONFIG = {
  url: 'https://proxy.cors.sh/',
  headers: CORS_API_KEY ? {
    'x-cors-api-key': CORS_API_KEY
  } : {}
};

// Fallback proxies if CORS.sh fails or reaches rate limits
const FALLBACK_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
];

// For backward compatibility
export const CORS_PROXIES = [CORS_SH_CONFIG.url, ...FALLBACK_PROXIES];

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
    // Handle special protocols directly
    if (url.startsWith('ipfs://') || url.startsWith('ar://')) return true;
    
    const urlObj = new URL(url);
    return CORS_RESTRICTED_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch (error) {
    logger.warn('Error checking URL for CORS proxy need:', { url, error: error.message });
    return false;
  }
};

/**
 * Applies the CORS.sh proxy to a URL
 * @param {string} url - The original URL
 * @returns {Object} An object with the proxied URL and required headers
 */
export const applyCorsShProxy = (url) => {
  if (!url || typeof url !== 'string') {
    return { url, headers: {} };
  }
  
  // Log warning if API key is missing
  if (!CORS_API_KEY) {
    logger.warn('CORS_API_KEY not found in environment variables. Proxy may have limited functionality.');
  }
  
  // Handle special protocols
  if (url.startsWith('ipfs://')) {
    const ipfsHash = url.replace('ipfs://', '');
    const gatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    return {
      url: `${CORS_SH_CONFIG.url}${gatewayUrl}`,
      headers: CORS_SH_CONFIG.headers
    };
  }
  
  if (url.startsWith('ar://')) {
    const arweaveHash = url.replace('ar://', '');
    const gatewayUrl = `https://arweave.net/${arweaveHash}`;
    return {
      url: `${CORS_SH_CONFIG.url}${gatewayUrl}`,
      headers: CORS_SH_CONFIG.headers
    };
  }
  
  // Handle regular URLs
  if (needsCorsProxy(url)) {
    return {
      url: `${CORS_SH_CONFIG.url}${url}`,
      headers: CORS_SH_CONFIG.headers
    };
  }
  
  // Return original URL if no proxy needed
  return { url, headers: {} };
};

/**
 * Applies a fallback proxy when CORS.sh fails
 * @param {string} url - The original URL
 * @param {number} proxyIndex - Index of the fallback proxy to use
 * @returns {string} URL with fallback proxy applied
 */
export const applyFallbackProxy = (url, proxyIndex = 0) => {
  if (!url || typeof url !== 'string') return url;
  
  // Make sure index is within bounds
  const index = proxyIndex % FALLBACK_PROXIES.length;
  return `${FALLBACK_PROXIES[index]}${url}`;
};

/**
 * For backward compatibility with existing code
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
    
    // Handle ipfs:// protocol
    if (url.startsWith('ipfs://')) {
      const ipfsHash = url.replace('ipfs://', '');
      // Return directly from IPFS gateway without proxy first
      const directGatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      
      // Use CORS.sh proxy if available, otherwise fallback
      if (CORS_API_KEY) {
        const proxiedUrl = `${CORS_SH_CONFIG.url}${directGatewayUrl}`;
        proxyCache.set(cacheKey, proxiedUrl);
        return proxiedUrl;
      } else {
        // Legacy fallback
        const proxiedUrl = `${CORS_PROXIES[proxyIndex % CORS_PROXIES.length]}${directGatewayUrl}`;
        proxyCache.set(cacheKey, proxiedUrl);
        return proxiedUrl;
      }
    }
    
    // Handle normal http/https URLs
    if (needsCorsProxy(url)) {
      // Use CORS.sh proxy if available, otherwise fallback
      if (CORS_API_KEY && proxyIndex === 0) {
        const proxiedUrl = `${CORS_SH_CONFIG.url}${url}`;
        proxyCache.set(cacheKey, proxiedUrl);
        return proxiedUrl;
      } else {
        // Legacy fallback with index adjustment
        const adjustedIndex = CORS_API_KEY ? (proxyIndex - 1) : proxyIndex;
        if (adjustedIndex >= 0 && adjustedIndex < CORS_PROXIES.length) {
          const proxiedUrl = `${CORS_PROXIES[adjustedIndex % CORS_PROXIES.length]}${url}`;
          proxyCache.set(cacheKey, proxiedUrl);
          return proxiedUrl;
        }
      }
    }
    
    return url;
  } catch (error) {
    logger.error('Error applying CORS proxy:', { url, error: error.message });
    return url;
  }
};

/**
 * Creates direct IPFS gateway URLs without using a proxy
 * This is useful as a fallback when proxies fail
 * @param {string} url - The original URL to convert
 * @returns {string} Direct IPFS gateway URL if applicable
 */
export const createDirectIpfsUrl = (url) => {
  if (!url) return null;
  
  try {
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
    logger.error('Error creating direct IPFS URL:', error);
    return url;
  }
};

/**
 * Creates direct gateway URLs for various protocols
 * This is the function missing from your original file
 * @param {string} url - The URL to convert
 * @returns {string} Direct gateway URL
 */
export const createDirectGatewayUrl = (url) => {
  if (!url) return null;
  
  try {
    // Handle ipfs:// protocol
    if (url.startsWith('ipfs://')) {
      return createDirectIpfsUrl(url);
    }
    
    // Handle ar:// protocol
    if (url.startsWith('ar://')) {
      const hash = url.replace('ar://', '');
      return `https://arweave.net/${hash}`;
    }
    
    return url;
  } catch (error) {
    logger.error('Error creating direct gateway URL:', error);
    return url;
  }
};

/**
 * Fetches content from Arweave with CORS handling
 * This is the function missing from your original file
 * @param {string} arweaveUrl - Arweave URL or transaction ID
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export const fetchArweaveContent = async (arweaveUrl, options = {}) => {
  if (!arweaveUrl) throw new Error('Arweave URL is required');
  
  // Handle ar:// protocol or direct transaction ID
  let url = arweaveUrl;
  if (arweaveUrl.startsWith('ar://')) {
    const txId = arweaveUrl.replace('ar://', '');
    url = `https://arweave.net/${txId}`;
  } else if (arweaveUrl.match(/^[a-zA-Z0-9_-]{43}$/)) {
    // This looks like a raw Arweave transaction ID
    url = `https://arweave.net/${arweaveUrl}`;
  }
  
  // Use fetchWithCorsProxy to handle CORS issues
  return fetchWithCorsProxy(url, options);
};

/**
 * Fetches content through a CORS proxy with fallback logic
 * @param {string} url - The original URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const fetchWithCorsProxy = async (url, options = {}) => {
  if (!url) throw new Error('URL is required');
  
  // Try without proxy first if it's not a known CORS-restricted domain
  if (!needsCorsProxy(url)) {
    try {
      const response = await fetch(url, {
        ...options,
        mode: 'cors',
        headers: {
          ...options.headers,
          'Accept': 'application/json, image/*, */*'
        }
      });
      if (response.ok) return response;
    } catch (error) {
      logger.debug('Direct fetch failed, trying with proxy:', { url, error: error.message });
      // Continue to proxy attempts
    }
  }
  
  let lastError = null;
  
  // Try with CORS.sh proxy first
  try {
    const { url: proxiedUrl, headers } = applyCorsShProxy(url);
    logger.debug('Trying CORS.sh proxy:', { originalUrl: url, proxiedUrl });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
    
    const response = await fetch(proxiedUrl, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        ...headers,
        'Accept': 'application/json, image/*, */*'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      logger.debug('CORS.sh proxy successful:', { url });
      return response;
    }
  } catch (error) {
    logger.warn('CORS.sh proxy failed:', { url, error: error.message });
    lastError = error;
    // Continue to fallback proxies
  }
  
  // Try with each fallback proxy
  for (let i = 0; i < FALLBACK_PROXIES.length; i++) {
    try {
      const fallbackUrl = applyFallbackProxy(url, i);
      logger.debug(`Trying fallback proxy ${i+1}:`, { originalUrl: url, proxiedUrl: fallbackUrl });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
      
      const response = await fetch(fallbackUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Accept': 'application/json, image/*, */*'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        logger.debug(`Fallback proxy ${i+1} successful:`, { url });
        return response;
      }
    } catch (error) {
      logger.warn(`Fallback proxy ${i+1} failed:`, { url, error: error.message });
      lastError = error;
      // Continue to the next proxy
    }
  }
  
  // If IPFS URL, try direct gateway as a last resort
  if (url.includes('ipfs') || url.startsWith('ipfs://')) {
    try {
      const directUrl = createDirectIpfsUrl(url);
      logger.debug('Trying direct IPFS gateway as fallback:', directUrl);
      
      const response = await fetch(directUrl, {
        ...options,
        mode: 'no-cors', // Last resort attempt
        headers: {
          ...options.headers,
          'Accept': 'application/json, image/*, */*'
        }
      });
      
      // With no-cors, we can't check response.ok, but we can return what we get
      return response;
    } catch (ipfsError) {
      logger.error('Direct IPFS gateway fallback failed:', ipfsError);
    }
  }
  
  // If all proxies fail, throw the last error
  throw lastError || new Error(`All CORS proxies failed for URL: ${url}`);
};

/**
 * Simplified image URL validation that's less likely to trigger CORS errors
 * @param {string} url - The URL to validate
 * @returns {Promise<string>} - The validated URL or null
 */
export const validateImageUrl = async (url) => {
  if (!url) return null;
  
  // Handle data URLs directly
  if (url.startsWith('data:')) {
    return url.startsWith('data:image/') ? url : null;
  }
  
  // Known image extensions - return directly without validation
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif'];
  if (imageExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
    return url;
  }
  
  // IPFS and Arweave URLs are likely to be images in NFT context
  if (url.includes('ipfs') || url.includes('arweave')) {
    return url; // Return without validation to avoid CORS issues
  }
  
  // For all other URLs, we'll trust them without validation
  // This reduces CORS errors at the expense of potentially showing broken images
  return url;
};