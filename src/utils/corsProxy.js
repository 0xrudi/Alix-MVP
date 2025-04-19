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
  'ipfs.nftstorage.link',
  'metadata.ens.domains'
];

// Get CORS.sh API key from environment variables
const CORS_SH_API_KEY = process.env.REACT_APP_CORS_API_KEY;

// Primary CORS proxy endpoints
const CORS_SH_PROXY = 'https://proxy.cors.sh/';

// Public CORS proxies that can be used as fallbacks
const FALLBACK_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest='
];

// Cache successful proxy results to improve performance
const proxyCache = new Map();
const failureCache = new Map();

/**
 * Determines if a URL is from a domain that typically has CORS issues
 * @param {string} url - The URL to check
 * @returns {boolean} True if the URL is from a domain with known CORS issues
 */
export const needsCorsProxy = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Handle protocol schemes that require proxying
    if (url.startsWith('ipfs://') || url.startsWith('ar://')) return true;
    
    const urlObj = new URL(url);
    return CORS_RESTRICTED_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch (error) {
    logger.warn('Error checking URL for CORS proxy need:', { url, error: error.message });
    return false;
  }
};

/**
 * Logs rate limit information from CORS proxy response headers
 * @param {Response} response - The fetch response
 */
const logRateLimitInfo = (response) => {
  try {
    // Check cors.sh specific rate limit headers
    const remaining = response.headers.get('x-ratelimit-remaining');
    const limit = response.headers.get('x-ratelimit-limit');
    const reset = response.headers.get('x-ratelimit-reset');
    
    if (remaining !== null && limit !== null) {
      logger.info('CORS.sh rate limit status:', { 
        remaining,
        limit,
        resetTime: reset ? new Date(parseInt(reset) * 1000).toISOString() : 'unknown'
      });
      
      // Log a warning if we're getting close to the limit
      if (parseInt(remaining) < parseInt(limit) * 0.1) {
        logger.warn('CORS.sh rate limit running low!', { remaining, limit });
      }
    }
  } catch (error) {
    logger.debug('Error parsing rate limit headers:', error);
  }
};

/**
 * Applies the CORS.sh proxy with authentication to a URL
 * @param {string} url - The URL to proxy
 * @returns {Object} An object with the proxied URL and headers
 */
export const applyCorsShProxy = (url) => {
  if (!url || typeof url !== 'string') {
    return { url, headers: {} };
  }
  
  // Skip if no API key
  if (!CORS_SH_API_KEY) {
    logger.warn('No CORS.sh API key found, falling back to regular proxy');
    return { url: applyCorsProxy(url), headers: {} };
  }
  
  // Check cache
  const cacheKey = `corssh-${url}`;
  if (proxyCache.has(cacheKey)) {
    return proxyCache.get(cacheKey);
  }
  
  try {
    let finalUrl = url;
    
    // Handle protocol conversions 
    if (url.startsWith('ipfs://')) {
      const ipfsHash = url.replace('ipfs://', '');
      finalUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    } else if (url.startsWith('ar://')) {
      const arweaveHash = url.replace('ar://', '');
      finalUrl = `https://arweave.net/${arweaveHash}`;
    }
    
    // Apply the CORS.sh proxy
    const proxiedUrl = `${CORS_SH_PROXY}${finalUrl}`;
    
    // Create result including auth headers
    const result = {
      url: proxiedUrl,
      headers: {
        'x-cors-api-key': CORS_SH_API_KEY
      }
    };
    
    // Cache the result
    proxyCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    logger.error('Error applying CORS.sh proxy:', { url, error: error.message });
    return { url, headers: {} };
  }
};

/**
 * Applies a generic CORS proxy to a URL (fallback when CORS.sh not available)
 * @param {string} url - The original URL
 * @param {number} proxyIndex - Index of the proxy to use (for fallback logic)
 * @returns {string} URL with proxy applied
 */
export const applyCorsProxy = (url, proxyIndex = 0) => {
  if (!url || typeof url !== 'string') return url;
  
  // Check cache first
  const cacheKey = `corsproxy-${url}-${proxyIndex}`;
  if (proxyCache.has(cacheKey)) {
    return proxyCache.get(cacheKey);
  }
  
  try {
    // Handle data URLs - no proxy needed
    if (url.startsWith('data:')) {
      return url;
    }
    
    // If CORS.sh API key is available, use it as the first choice 
    if (CORS_SH_API_KEY) {
      // We defer to the dedicated applyCorsShProxy function
      // which returns both URL and headers
      const { url: proxiedUrl } = applyCorsShProxy(url);
      return proxiedUrl; 
    }
    
    // Handle protocol conversions for fallback proxies
    let finalUrl = url;
    if (url.startsWith('ipfs://')) {
      const ipfsHash = url.replace('ipfs://', '');
      finalUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    } else if (url.startsWith('ar://')) {
      const arweaveHash = url.replace('ar://', '');
      finalUrl = `https://arweave.net/${arweaveHash}`;
    }
    
    // Use fallback proxy
    if (needsCorsProxy(finalUrl)) {
      const fallbackProxy = FALLBACK_PROXIES[proxyIndex % FALLBACK_PROXIES.length];
      const proxiedUrl = `${fallbackProxy}${finalUrl}`;
      proxyCache.set(cacheKey, proxiedUrl);
      return proxiedUrl;
    }
    
    return finalUrl;
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

// Add alias for backward compatibility
export const createDirectGatewayUrl = createDirectIpfsUrl;

/**
 * Fetches content through a CORS proxy with robust error handling and fallbacks
 * @param {string} url - The original URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const fetchWithCorsProxy = async (url, options = {}) => {
  if (!url) throw new Error('URL is required');
  
  // Try without proxy first if it's not a known CORS-restricted domain
  if (!needsCorsProxy(url)) {
    try {
      logger.debug('Attempting direct fetch without proxy:', url);
      const response = await fetch(url, {
        ...options,
        mode: 'cors',
        headers: {
          ...options.headers,
          'Accept': 'application/json, image/*, */*'
        }
      });
      
      if (response.ok) {
        logger.debug('Direct fetch successful:', url);
        return response;
      }
    } catch (error) {
      logger.debug('Direct fetch failed, trying with proxy:', { 
        url, 
        error: error.message 
      });
    }
  }
  
  // First try with CORS.sh if we have an API key
  if (CORS_SH_API_KEY) {
    try {
      const { url: proxiedUrl, headers } = applyCorsShProxy(url);
      logger.debug('Trying CORS.sh proxy with API key:', { originalUrl: url, proxiedUrl });
      
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
      
      // Check and log rate limit information
      logRateLimitInfo(response);
      
      if (response.ok) {
        logger.debug('CORS.sh proxy successful:', { url });
        return response;
      } else {
        // Add to failure cache if there's a problem with the response
        failureCache.set(url, { 
          timestamp: Date.now(), 
          reason: `Status: ${response.status}` 
        });
        
        // Check for rate limiting
        if (response.status === 429) {
          logger.warn('CORS.sh rate limit exceeded!', { url });
          // Continue to fallback proxies
        } else {
          logger.error('CORS.sh proxy returned error status:', { 
            url, 
            status: response.status 
          });
        }
      }
    } catch (error) {
      logger.warn('CORS.sh proxy failed:', { url, error: error.message });
      
      // Add to failure cache
      failureCache.set(url, { 
        timestamp: Date.now(), 
        reason: error.message 
      });
    }
  }
  
  // Try with each fallback proxy if CORS.sh fails
  let lastError = null;
  
  for (let i = 0; i < FALLBACK_PROXIES.length; i++) {
    try {
      const proxiedUrl = applyCorsProxy(url, i);
      logger.debug(`Trying fallback proxy ${i+1}/${FALLBACK_PROXIES.length}:`, { 
        originalUrl: url, 
        proxiedUrl 
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
        logger.debug(`Fallback proxy ${i+1} successful:`, { url });
        return response;
      }
    } catch (error) {
      logger.warn(`Fallback proxy ${i+1} failed:`, { 
        url, 
        proxy: FALLBACK_PROXIES[i], 
        error: error.message 
      });
      lastError = error;
      // Continue to the next proxy
    }
  }
  
  // If IPFS URL, try direct gateway as a last resort
  if (url.includes('ipfs') || url.startsWith('ipfs://')) {
    try {
      const directUrl = createDirectIpfsUrl(url);
      logger.debug('Trying direct IPFS gateway as final fallback:', directUrl);
      
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

/**
 * An alias for fetchWithCorsProxy for backward compatibility
 * @deprecated Use fetchWithCorsProxy instead
 */
export const fetchWithProxy = fetchWithCorsProxy;

/**
 * For backwards compatibility
 * @deprecated Use applyCorsProxy or applyCorsShProxy instead
 */
export const getCorsProxyUrl = (url) => {
  // Check if we have a CORS.sh API key
  if (process.env.REACT_APP_CORS_API_KEY) {
    return applyCorsShProxy(url).url;
  }
  return applyCorsProxy(url);
};