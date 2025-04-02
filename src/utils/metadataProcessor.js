// src/utils/metadataProcessor.js
import { logger } from './logger';
import { fetchWithCorsProxy, needsCorsProxy, applyCorsShProxy } from './corsProxy';
import { supabase } from './supabase';

/**
 * Media types that can be detected and processed
 */
export const MediaType = {
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  ANIMATION: 'animation',
  ARTICLE: 'article',
  MODEL: '3d',
  UNKNOWN: 'unknown'
};

/**
 * Process and get additional metadata for NFTs from IPFS/Arweave gateways
 * @param {Object} nft - The NFT object from Moralis or other sources
 * @param {string} walletId - The wallet ID associated with this NFT
 * @returns {Promise<Object>} - The NFT object with additional metadata
 */
export const processNFTMetadata = async (nft, walletId) => {
  if (!nft) return null;
  
  // Track attempts and success for analytics
  const processingStart = Date.now();
  let successfulFetch = false;
  let attemptedUrls = [];
  
  // Skip processing if the metadata is already present and has attributes
  if (nft.metadata && 
      (Array.isArray(nft.metadata.attributes) || 
       typeof nft.metadata.attributes === 'object') && 
      Object.keys(nft.metadata.attributes || {}).length > 0) {
    logger.debug('Metadata already has attributes, skipping processing', {
      tokenId: nft.id?.tokenId,
      contractAddress: nft.contract?.address
    });
    return nft;
  }
  
  logger.log('Processing metadata for NFT:', {
    tokenId: nft.id?.tokenId,
    contractAddress: nft.contract?.address,
    hasMetadata: !!nft.metadata,
    mediaGateway: nft.media?.[0]?.gateway
  });
  
  // Check for potential metadata URLs
  const potentialMetadataUrls = [
    nft.tokenUri,
    nft.metadata?.image_url,
    nft.metadata?.animation_url,
    nft.media?.[0]?.gateway,
    nft.metadata?.external_url,
    // Additional sources for metadata
    nft.metadata?.uri,
    nft.metadata?.metadata,
    nft.metadata?.token_uri
  ].filter(Boolean);
  
  // Arweave gateway URLs often contain metadata
  const arweaveUrls = potentialMetadataUrls.filter(url => 
    typeof url === 'string' && (
      url.includes('arweave.net') || 
      url.startsWith('ar://') ||
      // Check for raw arweave transaction IDs
      (url.match(/^[a-zA-Z0-9_-]{43}$/) && !url.includes('/'))
    )
  );
  
  // IPFS gateway URLs might also contain metadata
  const ipfsUrls = potentialMetadataUrls.filter(url => 
    typeof url === 'string' && (
      url.includes('ipfs.io') || 
      url.startsWith('ipfs://') ||
      url.includes('ipfs/')
    )
  );
  
  // Try to fetch metadata from Arweave first, then IPFS, then other sources
  const metadataUrls = [...arweaveUrls, ...ipfsUrls, ...potentialMetadataUrls];
  
  if (metadataUrls.length === 0) {
    logger.debug('No potential metadata URLs found for NFT', {
      tokenId: nft.id?.tokenId,
      contractAddress: nft.contract?.address
    });
    return nft;
  }
  
  // Try each URL until we find valid metadata
  for (const url of metadataUrls) {
    if (attemptedUrls.includes(url)) continue; // Skip URLs we've already tried
    attemptedUrls.push(url);
    
    try {
      logger.debug('Trying to fetch metadata from:', url);
      
      const normalizedUrl = normalizeGatewayUrl(url);
      if (!normalizedUrl) continue;
      
      // Use CORS proxy with proper error handling
      let response;
      try {
        if (needsCorsProxy(normalizedUrl)) {
          response = await fetchWithCorsProxy(normalizedUrl, {
            timeout: 8000, // More reasonable timeout
            headers: {
              'Accept': 'application/json'
            }
          });
        } else {
          response = await fetch(normalizedUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            },
            timeout: 8000
          });
        }
      } catch (fetchError) {
        logger.warn('Error fetching from URL', { 
          url: normalizedUrl, 
          error: fetchError.message 
        });
        continue;
      }
      
      // Some CORS proxies succeed but return error pages, so check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (contentType) {
          logger.debug('Non-JSON response, skipping', { 
            url: normalizedUrl, 
            contentType 
          });
        }
        continue;
      }
      
      // Parse the JSON with error handling
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        logger.warn('Error parsing JSON', { 
          url: normalizedUrl, 
          error: jsonError.message 
        });
        continue;
      }
      
      if (!data || typeof data !== 'object') {
        logger.debug('Empty or invalid response data', { url: normalizedUrl });
        continue;
      }
      
      // Success - we have metadata!
      successfulFetch = true;
      logger.debug('Successfully fetched metadata', { 
        url: normalizedUrl, 
        dataKeys: Object.keys(data) 
      });
      
      // Extract metadata fields we're interested in
      const additionalMetadata = {
        ...nft.metadata,
        name: data.name || nft.metadata?.name,
        description: data.description || nft.metadata?.description,
        image: data.image || data.image_url || nft.metadata?.image,
        attributes: data.attributes || data.traits || nft.metadata?.attributes || [],
        external_url: data.external_url || nft.metadata?.external_url,
        animation_url: data.animation_url || nft.metadata?.animation_url,
        background_color: data.background_color || nft.metadata?.background_color,
        // Add any other fields of interest here
        
        // Store additional processing metadata for debugging
        _processingInfo: {
          processedAt: new Date().toISOString(),
          sourceUrl: normalizedUrl,
          processingTimeMs: Date.now() - processingStart
        }
      };
      
      // Store the source of the additional metadata
      additionalMetadata.metadata_source = normalizedUrl;
      
      // Update the NFT object
      const updatedNFT = {
        ...nft,
        title: additionalMetadata.name || nft.title,
        description: additionalMetadata.description || nft.description,
        metadata: additionalMetadata
      };
      
      // If we have a wallet ID, update the metadata in Supabase
      if (walletId) {
        await saveMetadataToSupabase(updatedNFT, walletId);
      }
      
      // Log successful processing
      logger.info('Successfully added NFT metadata', {
        tokenId: nft.id?.tokenId,
        contractAddress: nft.contract?.address,
        sourceUrl: normalizedUrl,
        processingTimeMs: Date.now() - processingStart,
        hasAttributes: Array.isArray(additionalMetadata.attributes) 
          ? additionalMetadata.attributes.length 
          : typeof additionalMetadata.attributes === 'object'
            ? Object.keys(additionalMetadata.attributes).length
            : 0
      });
      
      return updatedNFT;
    } catch (error) {
      logger.error('Error processing metadata URL', { 
        url, 
        error: error.message 
      });
      // Continue to next URL
    }
  }
  
  // If all URLs failed, log the failure with details
  logger.warn('Failed to add NFT metadata after trying all URLs', {
    tokenId: nft.id?.tokenId,
    contractAddress: nft.contract?.address,
    attemptedUrls,
    processingTimeMs: Date.now() - processingStart
  });
  
  // Return the original NFT
  return nft;
};

/**
 * Extract media-specific information from NFT metadata
 * Used for populating the new media fields in the artifacts table
 * @param {Object} metadata - The NFT metadata
 * @returns {Object} - Media information with urls and types
 */
export const extractMediaInfo = (metadata) => {
  try {
    if (!metadata) {
      return {
        media_url: null,
        cover_image_url: null,
        media_type: null,
        additional_media: null
      };
    }

    // Initialize with null values
    let media_url = null;
    let cover_image_url = null;
    let media_type = null;
    const additional_media = {};

    // Handle string metadata (likely JSON)
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        logger.warn('Failed to parse metadata string as JSON', { 
          error: e, 
          metadata: typeof metadata === 'string' 
            ? metadata.substring(0, 100) + '...' 
            : metadata
        });
        return {
          media_url: null,
          cover_image_url: null,
          media_type: null,
          additional_media: null
        };
      }
    }

    // Safe type checking for metadata
    if (typeof metadata === 'object' && metadata !== null) {
      // Handle sound.xyz style metadata with animation_url
      if (metadata.animation_url) {
        media_url = metadata.animation_url;
        
        // Check mime type to determine media type
        if (metadata.mimeType) {
          if (metadata.mimeType.startsWith('audio/')) {
            media_type = MediaType.AUDIO;
          } else if (metadata.mimeType.startsWith('video/')) {
            media_type = MediaType.VIDEO;
          } else {
            media_type = MediaType.ANIMATION;
          }
        } else {
          // Infer from file extension if mime type is missing
          const extension = getExtensionFromUrl(media_url);
          if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
            media_type = MediaType.AUDIO;
          } else if (['mp4', 'webm', 'mov'].includes(extension)) {
            media_type = MediaType.VIDEO;
          } else {
            media_type = MediaType.ANIMATION;
          }
        }
      } 
      // Handle Mirror.xyz style metadata with content field
      else if (metadata.content) {
        media_url = metadata.content;
        media_type = MediaType.ARTICLE;
      } 
      // Handle standard NFT image
      else if (metadata.image) {
        media_url = metadata.image;
        media_type = MediaType.IMAGE;
      }

      // Extract cover image - with priority order
      if (metadata.image) {
        cover_image_url = metadata.image;
      } else if (metadata.artwork && metadata.artwork.uri) {
        cover_image_url = metadata.artwork.uri;
      } else if (metadata.image_url) {
        cover_image_url = metadata.image_url;
      } else if (metadata.thumbnail && metadata.thumbnail.uri) {
        cover_image_url = metadata.thumbnail.uri;
      }

      // Collect additional media references for future use
      if (metadata.image_data) {
        additional_media.image_data = metadata.image_data;
      }
      if (metadata.image_url && metadata.image_url !== metadata.image) {
        additional_media.image_url = metadata.image_url;
      }
      if (metadata.external_url) {
        additional_media.external_url = metadata.external_url;
      }
      if (metadata.animation_url && metadata.animation_url !== media_url) {
        additional_media.animation_url = metadata.animation_url;
      }
      if (metadata.youtube_url) {
        additional_media.youtube_url = metadata.youtube_url;
      }
      if (metadata.properties && typeof metadata.properties === 'object') {
        // Some NFTs store media info in properties
        additional_media.properties = metadata.properties;
      }
    }

    // Convert URIs to full URLs
    if (media_url) media_url = normalizeGatewayUrl(media_url);
    if (cover_image_url) cover_image_url = normalizeGatewayUrl(cover_image_url);

    return {
      media_url,
      cover_image_url,
      media_type,
      additional_media: Object.keys(additional_media).length > 0 ? additional_media : null
    };
  } catch (error) {
    logger.error('Error extracting media info:', error);
    return {
      media_url: null,
      cover_image_url: null,
      media_type: null,
      additional_media: null
    };
  }
};

/**
 * Gets file extension from a URL
 */
export const getExtensionFromUrl = (url) => {
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

/**
 * Save metadata to Supabase with improved error handling
 * @param {Object} nft - The NFT with metadata
 * @param {string} walletId - The wallet ID associated with this NFT
 * @returns {Promise<boolean>} - Success status
 */
export const saveMetadataToSupabase = async (nft, walletId) => {
  if (!nft || !nft.id || !nft.contract || !walletId) {
    logger.warn('Invalid NFT or wallet data for Supabase update', { nft, walletId });
    return false;
  }
  
  try {
    // Check if artifact already exists with efficient query
    const { data: artifacts, error: findError } = await supabase
      .from('artifacts')
      .select('id')
      .eq('token_id', nft.id.tokenId)
      .eq('contract_address', nft.contract.address)
      .eq('wallet_id', walletId)
      .limit(1);
      
    if (findError) {
      logger.error('Error finding artifact in Supabase', findError);
      return false;
    }
    
    // Prepare metadata for storage
    // Ensure it's a proper JSON object, not a string
    let processedMetadata = nft.metadata;
    if (typeof processedMetadata === 'string') {
      try {
        processedMetadata = JSON.parse(processedMetadata);
      } catch (e) {
        logger.warn('Failed to parse metadata string, storing as-is', {
          error: e.message,
          tokenId: nft.id.tokenId
        });
      }
    }
    
    // Extract media information from metadata
    const mediaInfo = extractMediaInfo(processedMetadata);
    
    // Prepare the update data with proper defaults and enhanced media fields
    const updateData = {
      metadata: processedMetadata,
      title: nft.title || nft.metadata?.name || `Token ID: ${nft.id.tokenId}`,
      description: nft.description || nft.metadata?.description || '',
      media_url: mediaInfo.media_url || nft.media?.[0]?.gateway || '',
      cover_image_url: mediaInfo.cover_image_url || '',
      media_type: mediaInfo.media_type || null,
      additional_media: mediaInfo.additional_media || null,
      updated_at: new Date().toISOString()
    };
    
    if (artifacts && artifacts.length > 0) {
      // Update existing artifact
      const { error: updateError } = await supabase
        .from('artifacts')
        .update(updateData)
        .eq('id', artifacts[0].id);
        
      if (updateError) {
        logger.error('Error updating artifact metadata in Supabase', updateError);
        return false;
      } else {
        logger.debug('Metadata updated in Supabase', {
          artifactId: artifacts[0].id,
          tokenId: nft.id.tokenId
        });
        return true;
      }
    } else {
      // Create new artifact
      const { error: insertError } = await supabase
        .from('artifacts')
        .insert([{
          wallet_id: walletId,
          token_id: nft.id.tokenId,
          contract_address: nft.contract.address,
          network: nft.network || 'unknown',
          is_spam: nft.isSpam || false,
          ...updateData,
          created_at: new Date().toISOString()
        }]);
        
      if (insertError) {
        logger.error('Error creating artifact with metadata in Supabase', insertError);
        return false;
      } else {
        logger.debug('New artifact with metadata created in Supabase', {
          tokenId: nft.id.tokenId,
          contractAddress: nft.contract.address
        });
        return true;
      }
    }
  } catch (error) {
    logger.error('Error saving metadata to Supabase', error);
    return false;
  }
};

/**
 * Normalize gateway URLs to a standardized format with improved handling
 * @param {string} url - The URL to normalize
 * @returns {string|null} - Normalized URL or null if invalid
 */
export const normalizeGatewayUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Clean the URL first (handle potential encoding issues)
  const cleanUrl = url.trim().replace(/\s+/g, '');
  if (!cleanUrl) return null;
  
  // Handle Arweave protocol
  if (cleanUrl.startsWith('ar://')) {
    const hash = cleanUrl.replace('ar://', '');
    return `https://arweave.net/${hash}`;
  }
  
  // Handle raw Arweave transaction IDs
  if (cleanUrl.match(/^[a-zA-Z0-9_-]{43}$/)) {
    return `https://arweave.net/${cleanUrl}`;
  }
  
  // Handle IPFS protocol
  if (cleanUrl.startsWith('ipfs://')) {
    const hash = cleanUrl.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${hash}`;
  }
  
  // Handle IPFS URLs with CID in the path
  if (cleanUrl.includes('/ipfs/')) {
    const parts = cleanUrl.split('/ipfs/');
    const hash = parts[1];
    return `https://ipfs.io/ipfs/${hash}`;
  }
  
  // Special case for URLs with ":/ipfs/" which is a common typo/format
  if (cleanUrl.includes(':/ipfs/')) {
    const parts = cleanUrl.split(':/ipfs/');
    if (parts.length > 1) {
      return `https://ipfs.io/ipfs/${parts[1]}`;
    }
  }
  
  // For HTTP/HTTPS URLs, return as-is
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }
  
  // If it doesn't match any known pattern, try to make a best guess
  if (cleanUrl.includes('ipfs')) {
    // It likely contains an IPFS CID somewhere
    const words = cleanUrl.split(/[^a-zA-Z0-9]/);
    for (const word of words) {
      // Look for something that could be a CID (base58 or base32)
      if (word.length >= 40 && /^[a-zA-Z0-9]+$/.test(word)) {
        return `https://ipfs.io/ipfs/${word}`;
      }
    }
  }
  
  // Last resort - if it looks like a domain or path, make it https
  if (cleanUrl.includes('.') && !cleanUrl.includes(' ')) {
    return `https://${cleanUrl.replace(/^\/\//, '')}`;
  }
  
  return null;
};

/**
 * Batch process metadata for multiple NFTs with better concurrency control
 * @param {Array} nfts - Array of NFT objects
 * @param {string} walletId - Wallet ID associated with these NFTs
 * @param {function} progressCallback - Optional callback for progress updates
 * @param {number} concurrency - Number of concurrent requests, default 5
 * @returns {Promise<Array>} - Array of updated NFT objects
 */
export const batchProcessMetadata = async (nfts, walletId, progressCallback, concurrency = 5) => {
  if (!Array.isArray(nfts) || nfts.length === 0) return [];
  
  const results = [];
  const total = nfts.length;
  const processingStart = Date.now();
  let completedCount = 0;
  let successCount = 0;
  let failCount = 0;
  
  // Process concurrency batches of NFTs
  for (let i = 0; i < total; i += concurrency) {
    const batch = nfts.slice(i, i + concurrency);
    
    // Process this batch concurrently
    const batchPromises = batch.map(async (nft, index) => {
      try {
        const processed = await processNFTMetadata(nft, walletId);
        
        const hasAdditionalMetadata = 
          processed && 
          processed.metadata && 
          processed.metadata !== nft.metadata;
        
        if (hasAdditionalMetadata) {
          successCount++;
        } else {
          failCount++;
        }
        
        return processed || nft;
      } catch (error) {
        logger.error('Error in batch metadata processing', { 
          index: i + index, 
          error: error.message,
          nft: nft?.id?.tokenId 
        });
        failCount++;
        return nft; // Keep original NFT on error
      } finally {
        completedCount++;
        
        // Update progress every 5% or for each NFT if small batch
        if (progressCallback && (completedCount % Math.max(1, Math.floor(total * 0.05)) === 0 || completedCount === total)) {
          progressCallback(Math.round(completedCount / total * 100));
        }
      }
    });

    // Wait for this batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches to avoid overwhelming the API
    if (i + concurrency < total) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Log batch processing summary
  logger.info('Batch metadata processing complete', {
    totalNFTs: total,
    successCount,
    failCount,
    processingTimeMs: Date.now() - processingStart,
    averageTimePerNFT: Math.round((Date.now() - processingStart) / total)
  });
  
  return results;
};

/**
 * Process metadata for an entire wallet with improved error handling and reporting
 * @param {string} walletId - The wallet ID to process 
 * @param {Object} nftsByNetwork - NFTs organized by network
 * @param {function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Object>} - NFTs organized by network with additional metadata
 */
export const processWalletMetadata = async (walletId, nftsByNetwork, progressCallback) => {
  if (!walletId || !nftsByNetwork) return nftsByNetwork;
  
  const processingStart = Date.now();
  const updatedNftsByNetwork = { ...nftsByNetwork };
  const allNetworks = Object.keys(nftsByNetwork);
  const totalNetworks = allNetworks.length;
  
  // Count total NFTs for progress calculation
  const totalNFTs = Object.values(nftsByNetwork).reduce((total, networkNFTs) => {
    return total + 
      (networkNFTs.ERC721?.length || 0) + 
      (networkNFTs.ERC1155?.length || 0);
  }, 0);
  
  // Initialize stats
  let processedNFTs = 0;
  let successCount = 0;
  let failCount = 0;
  
  // Report initial progress
  if (progressCallback) {
    progressCallback(0);
  }
  
  // Process each network
  for (let i = 0; i < totalNetworks; i++) {
    const network = allNetworks[i];
    const networkNFTs = nftsByNetwork[network];
    
    if (!networkNFTs) {
      logger.warn(`No NFTs found for network: ${network}`);
      continue;
    }
    
    // Concatenate both token types for total count
    const networkTotal = 
      (networkNFTs.ERC721?.length || 0) + 
      (networkNFTs.ERC1155?.length || 0);
    
    logger.info(`Processing ${networkTotal} NFTs for network: ${network}`, {
      walletId,
      erc721Count: networkNFTs.ERC721?.length || 0,
      erc1155Count: networkNFTs.ERC1155?.length || 0
    });
    
    // Process ERC721 tokens in batches
    if (Array.isArray(networkNFTs.ERC721) && networkNFTs.ERC721.length > 0) {
      const batchResults = await batchProcessMetadata(
        networkNFTs.ERC721.map(nft => ({
          ...nft,
          network,
          walletId
        })),
        walletId,
        (batchProgress) => {
          // Calculate overall progress considering both token types
          const erc721Weight = networkNFTs.ERC721.length / networkTotal;
          const networkProgress = batchProgress * erc721Weight;
          const overallProgress = 
            (i / totalNetworks) * 100 + 
            (1 / totalNetworks) * networkProgress;
          
          if (progressCallback) {
            progressCallback(Math.round(overallProgress));
          }
        },
        5 // Process 5 NFTs at a time
      );
      
      // Count successes and failures
      batchResults.forEach((result, index) => {
        const original = networkNFTs.ERC721[index];
        if (result.metadata !== original.metadata) {
          successCount++;
        } else {
          failCount++;
        }
      });
      
      updatedNftsByNetwork[network].ERC721 = batchResults;
      processedNFTs += batchResults.length;
    }
    
    // Process ERC1155 tokens in batches
    if (Array.isArray(networkNFTs.ERC1155) && networkNFTs.ERC1155.length > 0) {
      const batchResults = await batchProcessMetadata(
        networkNFTs.ERC1155.map(nft => ({
          ...nft,
          network,
          walletId
        })),
        walletId,
        (batchProgress) => {
          // Calculate overall progress considering both token types
          const erc1155Weight = networkNFTs.ERC1155.length / networkTotal;
          const networkProgress = 
            (networkNFTs.ERC721?.length ? 100 : 0) * (networkNFTs.ERC721?.length / networkTotal) +
            batchProgress * erc1155Weight;
          const overallProgress = 
            (i / totalNetworks) * 100 + 
            (1 / totalNetworks) * networkProgress;
          
          if (progressCallback) {
            progressCallback(Math.round(overallProgress));
          }
        },
        5 // Process 5 NFTs at a time
      );
      
      // Count successes and failures
      batchResults.forEach((result, index) => {
        const original = networkNFTs.ERC1155[index];
        if (result.metadata !== original.metadata) {
          successCount++;
        } else {
          failCount++;
        }
      });
      
      updatedNftsByNetwork[network].ERC1155 = batchResults;
      processedNFTs += batchResults.length;
    }
  }
  
  // Final progress update
  if (progressCallback) {
    progressCallback(100);
  }
  
  // Log results
  logger.info('Wallet metadata processing complete', {
    walletId,
    totalNFTs,
    processedNFTs,
    successCount,
    failCount,
    processingTimeMs: Date.now() - processingStart,
    averageTimePerNFT: Math.round((Date.now() - processingStart) / totalNFTs)
  });
  
  return updatedNftsByNetwork;
};