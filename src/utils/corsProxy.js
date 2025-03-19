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
// Replaced cors-anywhere with more reliable alternatives
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://proxy.cors.sh/',
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
    // Handle ipfs:// protocol directly
    if (url.startsWith('ipfs://')) return true;
    
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
    
    // Handle ipfs:// protocol
    if (url.startsWith('ipfs://')) {
      const ipfsHash = url.replace('ipfs://', '');
      // Return directly from IPFS gateway without proxy first
      const directGatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      // Apply proxy
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
 * Enhanced fetch function for Arweave content with direct URL fallback
 * @param {string} url - Arweave URL to fetch
 * @returns {Promise<Object>} - Parsed JSON data or null
 */
export const fetchArweaveContent = async (url, options = {}) => {
    // First, ensure URL is properly formatted
    if (url.startsWith('ar://')) {
      const hash = url.replace('ar://', '');
      url = `https://arweave.net/${hash}`;
    }
    
    logger.debug('Fetching Arweave content:', url);
    
    // Try traditional fetch first
    try {
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: options.timeout || 8000
      });
      
      if (response.ok) {
        const data = await response.json();
        logger.debug('Successfully fetched Arweave content directly');
        return data;
      }
    } catch (directError) {
      logger.debug('Direct Arweave fetch failed, trying alternatives:', directError.message);
      // Continue to alternatives
    }
    
    // Try with each proxy
    for (const proxy of CORS_PROXIES) {
      try {
        const proxiedUrl = `${proxy}${url}`;
        logger.debug(`Trying Arweave fetch with proxy: ${proxy}`);
        
        const response = await fetch(proxiedUrl, {
          ...options,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...options.headers
          },
          timeout: options.timeout || 8000
        });
        
        if (response.ok) {
          const data = await response.json();
          logger.debug('Successfully fetched Arweave content with proxy:', proxy);
          return data;
        }
      } catch (proxyError) {
        logger.debug(`Proxy fetch failed with ${proxy}:`, proxyError.message);
        // Try next proxy
      }
    }
    
    // If all methods fail, log an error
    logger.error('All methods to fetch Arweave content failed:', url);
    return null;
  };


/**
 * Fetches content through a CORS proxy with fallback logic
 * @param {string} url - The original URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retryCount - Number of retries (internal use)
 * @param {number} backoffMs - Backoff time in ms (internal use)
 * @returns {Promise<Response>} Fetch response
 */
export const fetchWithCorsProxy = async (
    url, 
    options = {}, 
    retryCount = 0, 
    backoffMs = 1000
  ) => {
    if (!url) throw new Error('URL is required');
    const maxRetries = options.maxRetries || 3;
    
    // List of alternate proxies to try if main ones fail
    const ALTERNATE_PROXIES = [
      'https://api.allorigins.win/raw?url=',
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://thingproxy.freeboard.io/fetch/'
    ];
    
    // Try without proxy first if it's not a known CORS-restricted domain
    if (retryCount === 0 && !needsCorsProxy(url)) {
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
        logger.debug('Direct fetch failed, trying with proxy:', { 
          url, 
          error: error.message 
        });
        // Continue to proxy attempts
      }
    }
    
    // If we've exceeded retries, try the direct IPFS/Arweave gateway as last resort
    if (retryCount >= maxRetries) {
      if (url.includes('ipfs') || url.startsWith('ipfs://')) {
        try {
          const directUrl = createDirectIpfsUrl(url);
          logger.debug('Final retry with direct IPFS gateway:', directUrl);
          
          return fetch(directUrl, {
            ...options,
            mode: 'no-cors', // Last resort attempt
            headers: {
              ...options.headers,
              'Accept': 'application/json, image/*, */*'
            }
          });
        } catch (ipfsError) {
          logger.error('Direct IPFS gateway fallback failed:', ipfsError);
        }
      } else if (url.includes('arweave.net') || url.startsWith('ar://')) {
        // For Arweave, simply return the URL itself so the client can handle it
        logger.warn('All proxies failed, returning Arweave URL for direct client handling:', url);
        
        // Create a mock Response object to avoid errors
        return new Response(JSON.stringify({ 
          error: 'proxy_failed', 
          directUrl: url 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      throw new Error(`All proxies failed for URL after ${maxRetries} retries: ${url}`);
    }
    
    // Use different proxy sets based on retry count
    const proxyList = retryCount === 0 ? CORS_PROXIES : ALTERNATE_PROXIES;
    const proxyIndex = retryCount % proxyList.length;
    const proxyUrl = proxyList[proxyIndex];
    
    try {
      const proxiedUrl = `${proxyUrl}${url}`;
      logger.debug(`Proxy attempt ${retryCount+1}/${maxRetries}:`, { 
        proxy: proxyUrl, 
        url 
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
      
      const response = await fetch(proxiedUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Accept': 'application/json, image/*, */*'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        logger.debug(`Proxy attempt ${retryCount+1} successful:`, { 
          url, 
          proxy: proxyUrl 
        });
        return response;
      }
      
      // If we get rate limited (429), add exponential backoff
      if (response.status === 429) {
        logger.warn(`Proxy rate limited:`, { url, proxy: proxyUrl });
        const waitTime = backoffMs * Math.pow(2, retryCount);
        
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Retry with next proxy
        return fetchWithCorsProxy(url, options, retryCount + 1, backoffMs);
      }
      
      // For other status codes, try next proxy immediately
      throw new Error(`Proxy returned status ${response.status}`);
    } catch (error) {
      logger.warn(`Proxy attempt ${retryCount+1} failed:`, { 
        url, 
        proxy: proxyUrl, 
        error: error.message 
      });
      
      // Wait briefly before trying the next proxy
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Retry with next proxy
      return fetchWithCorsProxy(url, options, retryCount + 1, backoffMs);
    }
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