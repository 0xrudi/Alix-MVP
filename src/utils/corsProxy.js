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
  'cloudflare-ipfs.com'
];

// Public CORS proxies that can be used (in order of preference)
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
  'https://cors-proxy.fringe.zone/'
];

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
  
  try {
    // Handle ipfs:// protocol
    if (url.startsWith('ipfs://')) {
      const ipfsHash = url.replace('ipfs://', '');
      // Return proxied IPFS gateway URL
      return `${CORS_PROXIES[proxyIndex % CORS_PROXIES.length]}https://ipfs.io/ipfs/${ipfsHash}`;
    }
    
    // Handle normal http/https URLs
    if (needsCorsProxy(url)) {
      return `${CORS_PROXIES[proxyIndex % CORS_PROXIES.length]}${url}`;
    }
    
    return url;
  } catch (error) {
    logger.error('Error applying CORS proxy:', { url, error: error.message });
    return url;
  }
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
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (error) {
      logger.debug('Direct fetch failed, trying with proxy:', { url, error: error.message });
      // Continue to proxy attempts
    }
  }
  
  // Try with each proxy until one works
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxiedUrl = applyCorsProxy(url, i);
      logger.debug(`Trying proxy ${i+1}/${CORS_PROXIES.length}:`, { originalUrl: url, proxiedUrl });
      
      const response = await fetch(proxiedUrl, options);
      if (response.ok) {
        logger.debug(`Proxy ${i+1} successful:`, { url, proxy: CORS_PROXIES[i] });
        return response;
      }
    } catch (error) {
      logger.warn(`Proxy ${i+1} failed:`, { url, proxy: CORS_PROXIES[i], error: error.message });
      // Continue to the next proxy
    }
  }
  
  // If all proxies fail, throw an error
  throw new Error(`All CORS proxies failed for URL: ${url}`);
};