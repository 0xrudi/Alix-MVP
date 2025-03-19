// src/utils/metadataProcessor.js
import { logger } from './logger';
import { fetchWithCorsProxy, needsCorsProxy } from './corsProxy';
import { supabase } from './supabase';

/**
 * Process and enhance NFT metadata with data from IPFS/Arweave gateways
 * @param {Object} nft - The NFT object from Moralis or other sources
 * @param {string} walletId - The wallet ID associated with this NFT
 * @returns {Promise<Object>} - The enhanced NFT object with processed metadata
 */
export const processNFTMetadata = async (nft, walletId) => {
    if (!nft) return null;
    
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
      nft.metadata?.external_url
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
    
    // Try to fetch metadata from Arweave first, then IPFS
    const metadataUrls = [...arweaveUrls, ...ipfsUrls];
    
    if (metadataUrls.length === 0) {
      logger.debug('No potential metadata URLs found for NFT', {
        tokenId: nft.id?.tokenId,
        contractAddress: nft.contract?.address
      });
      return nft;
    }
    
    // Try each URL until we find valid metadata
    for (const url of metadataUrls) {
      try {
        logger.debug('Trying to fetch metadata from:', url);
        
        const normalizedUrl = normalizeGatewayUrl(url);
        if (!normalizedUrl) continue;
        
        // Use proper fetching method based on URL type
        let response;
        try {
          // For Arweave URLs, use the specialized fetcher
          if (url.includes('arweave.net') || url.startsWith('ar://')) {
            const arweaveData = await fetchArweaveContent(normalizedUrl);
            if (arweaveData) {
              // Check if it's podcast metadata and process accordingly
              if (isPodcastMetadata(arweaveData)) {
                logger.debug('Detected podcast metadata format', { url });
                
                const podcastData = processPodcastMetadata(arweaveData);
                
                // Merge with existing metadata
                const enhancedMetadata = {
                  ...nft.metadata,
                  ...podcastData,
                  metadata_source: normalizedUrl
                };
                
                // Update the NFT object
                const enhancedNFT = {
                  ...nft,
                  title: enhancedMetadata.name || nft.title,
                  description: enhancedMetadata.description || nft.description,
                  metadata: enhancedMetadata
                };
                
                // If we have a wallet ID, update the metadata in Supabase
                if (walletId) {
                  await saveMetadataToSupabase(enhancedNFT, walletId);
                }
                
                return enhancedNFT;
              }
              
              // Continue with normal metadata processing
              response = new Response(JSON.stringify(arweaveData), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            } else {
              // If Arweave fetch failed, continue to next URL
              continue;
            }
          } else if (needsCorsProxy(normalizedUrl)) {
            // Use CORS proxy for other URLs that need it
            response = await fetchWithCorsProxy(normalizedUrl, {
              maxRetries: 3,
              timeout: 8000
            });
          } else {
            // Direct fetch for URLs that don't need proxying
            response = await fetch(normalizedUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              },
              timeout: 5000
            });
          }
        } catch (fetchError) {
          logger.warn('Error fetching from URL', { url: normalizedUrl, error: fetchError.message });
          continue;
        }
        
        if (!response.ok) {
          logger.warn('Failed to fetch metadata', { url, status: response.status });
          continue;
        }
        
        const contentType = response.headers.get('content-type');
        
        // Only process JSON responses
        if (!contentType || !contentType.includes('application/json')) {
          logger.debug('Response is not JSON', { url, contentType });
          continue;
        }
        
        const data = await response.json();
        
        if (!data) {
          logger.debug('Empty response data', { url });
          continue;
        }
        
        logger.debug('Successfully fetched metadata', { 
          url, 
          dataKeys: Object.keys(data) 
        });
        
        // Check for podcast-specific metadata
        if (isPodcastMetadata(data)) {
          logger.debug('Detected podcast metadata format', { url });
          
          const podcastData = processPodcastMetadata(data);
          
          // Merge with existing metadata
          const enhancedMetadata = {
            ...nft.metadata,
            ...podcastData,
            metadata_source: normalizedUrl
          };
          
          // Update the NFT object
          const enhancedNFT = {
            ...nft,
            title: enhancedMetadata.name || nft.title,
            description: enhancedMetadata.description || nft.description,
            metadata: enhancedMetadata
          };
          
          // If we have a wallet ID, update the metadata in Supabase
          if (walletId) {
            await saveMetadataToSupabase(enhancedNFT, walletId);
          }
          
          return enhancedNFT;
        }
        
        // Process regular metadata
        const enhancedMetadata = {
          ...nft.metadata,
          name: data.name || nft.metadata?.name,
          description: data.description || nft.metadata?.description,
          image: data.image || data.image_url || nft.metadata?.image,
          attributes: data.attributes || data.traits || nft.metadata?.attributes || [],
          external_url: data.external_url || nft.metadata?.external_url,
          animation_url: data.animation_url || nft.metadata?.animation_url,
          // Add any other fields of interest here
          background_color: data.background_color || nft.metadata?.background_color,
        };
        
        // Store the source of the enhanced metadata
        enhancedMetadata.metadata_source = normalizedUrl;
        
        // Update the NFT object
        const enhancedNFT = {
          ...nft,
          title: enhancedMetadata.name || nft.title,
          description: enhancedMetadata.description || nft.description,
          metadata: enhancedMetadata
        };
        
        // If we have a wallet ID, update the metadata in Supabase
        if (walletId) {
          await saveMetadataToSupabase(enhancedNFT, walletId);
        }
        
        return enhancedNFT;
      } catch (error) {
        logger.error('Error processing metadata URL', { url, error: error.message });
        // Continue to next URL
      }
    }
    
    // If all URLs failed, return the original NFT
    return nft;
  };
  
  /**
   * Check if metadata appears to be from a podcast
   * @param {Object} metadata - The metadata to check 
   * @returns {boolean} True if it appears to be podcast metadata
   */
  const isPodcastMetadata = (metadata) => {
    return !!(
      metadata.podcast || 
      metadata.episodeTitle || 
      metadata.episodeNumber ||
      (metadata.primaryMedia && metadata.primaryMedia.kind === 'AUDIO') ||
      (metadata.primaryMedia && metadata.primaryMedia.type && metadata.primaryMedia.type.includes('audio')) ||
      (Array.isArray(metadata.credits) && metadata.credits.length > 0)
    );
  };
  
  /**
   * Process metadata specifically for podcast NFTs
   * @param {Object} metadata - The raw metadata 
   * @returns {Object} Enhanced metadata with extracted fields
   */
  const processPodcastMetadata = (metadata) => {
    if (!metadata) return {};
    
    // Extract standard fields
    const processed = {
      name: metadata.name || metadata.episodeTitle,
      description: metadata.description,
      image: metadata.image,
      animation_url: metadata.animation_url,
      external_url: metadata.external_url,
      attributes: []
    };
    
    // Extract podcast-specific fields
    if (metadata.podcast || metadata.collection) {
      processed.attributes.push({
        trait_type: "Collection",
        value: metadata.podcast || metadata.collection
      });
    }
    
    if (metadata.episodeNumber) {
      processed.attributes.push({
        trait_type: "Episode Number",
        value: metadata.episodeNumber
      });
    }
    
    // Process credits
    if (Array.isArray(metadata.credits)) {
      metadata.credits.forEach(credit => {
        processed.attributes.push({
          trait_type: `${credit.role.charAt(0) + credit.role.slice(1).toLowerCase()}`,
          value: credit.name
        });
      });
    }
    
    // Convert any artwork/media objects to direct URLs
    if (metadata.artwork && metadata.artwork.uri) {
      processed.image = metadata.artwork.uri;
    }
    
    if (metadata.primaryMedia && metadata.primaryMedia.uri) {
      processed.animation_url = metadata.primaryMedia.uri;
      processed.mediaType = metadata.primaryMedia.type || 'audio/mpeg';
      
      processed.attributes.push({
        trait_type: "Media Type",
        value: metadata.primaryMedia.kind || "Audio"
      });
      
      if (metadata.primaryMedia.duration) {
        const minutes = Math.floor(metadata.primaryMedia.duration / 60);
        const seconds = Math.round(metadata.primaryMedia.duration % 60);
        processed.attributes.push({
          trait_type: "Duration",
          value: `${minutes}:${seconds.toString().padStart(2, '0')}`
        });
      }
    }
    
    // Process properties
    if (metadata.properties) {
      Object.entries(metadata.properties).forEach(([key, value]) => {
        // Handle both string values and nested objects
        if (typeof value === 'object' && value !== null) {
          processed.attributes.push({
            trait_type: value.name || key,
            value: value.value
          });
        } else if (value !== null && value !== undefined) {
          processed.attributes.push({
            trait_type: key,
            value: value
          });
        }
      });
    }
    
    return processed;
  };

/**
 * Save enhanced metadata to Supabase
 * @param {Object} nft - The NFT with enhanced metadata
 * @param {string} walletId - The wallet ID associated with this NFT
 */
export const saveMetadataToSupabase = async (nft, walletId) => {
  if (!nft || !nft.id || !nft.contract || !walletId) {
    logger.warn('Invalid NFT or wallet data for Supabase update', { nft, walletId });
    return;
  }
  
  try {
    // Check if artifact already exists
    const { data: artifacts, error: findError } = await supabase
      .from('artifacts')
      .select('id')
      .eq('token_id', nft.id.tokenId)
      .eq('contract_address', nft.contract.address)
      .eq('wallet_id', walletId);
      
    if (findError) {
      logger.error('Error finding artifact', findError);
      return;
    }
    
    const updateData = {
      metadata: nft.metadata,
      title: nft.title || nft.metadata?.name || `Token ID: ${nft.id.tokenId}`,
      description: nft.description || nft.metadata?.description || '',
      media_url: nft.metadata?.image || nft.media?.[0]?.gateway || ''
    };
    
    if (artifacts && artifacts.length > 0) {
      // Update existing artifact
      const { error: updateError } = await supabase
        .from('artifacts')
        .update(updateData)
        .eq('id', artifacts[0].id);
        
      if (updateError) {
        logger.error('Error updating artifact metadata', updateError);
      } else {
        logger.debug('Metadata updated in Supabase', {
          artifactId: artifacts[0].id,
          tokenId: nft.id.tokenId
        });
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
          ...updateData
        }]);
        
      if (insertError) {
        logger.error('Error creating artifact with metadata', insertError);
      } else {
        logger.debug('New artifact with metadata created in Supabase', {
          tokenId: nft.id.tokenId,
          contractAddress: nft.contract.address
        });
      }
    }
  } catch (error) {
    logger.error('Error saving metadata to Supabase', error);
  }
};

/**
 * Normalize gateway URLs to a standardized format
 * @param {string} url - The URL to normalize
 * @returns {string|null} - Normalized URL or null if invalid
 */
export const normalizeGatewayUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Handle Arweave protocol
  if (url.startsWith('ar://')) {
    const hash = url.replace('ar://', '');
    return `https://arweave.net/${hash}`;
  }
  
  // Handle raw Arweave transaction IDs
  if (url.match(/^[a-zA-Z0-9_-]{43}$/)) {
    return `https://arweave.net/${url}`;
  }
  
  // Handle IPFS protocol
  if (url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${hash}`;
  }
  
  // Handle IPFS URLs with CID in the path
  if (url.includes('/ipfs/')) {
    const parts = url.split('/ipfs/');
    const hash = parts[1];
    return `https://ipfs.io/ipfs/${hash}`;
  }
  
  // For HTTP/HTTPS URLs, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  return null;
};

/**
 * Batch process metadata for multiple NFTs
 * @param {Array} nfts - Array of NFT objects
 * @param {string} walletId - Wallet ID associated with these NFTs
 * @param {function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Array>} - Array of enhanced NFT objects
 */
export const batchProcessMetadata = async (nfts, walletId, progressCallback) => {
  if (!Array.isArray(nfts) || nfts.length === 0) return [];
  
  const results = [];
  const total = nfts.length;
  
  for (let i = 0; i < total; i++) {
    try {
      const processed = await processNFTMetadata(nfts[i], walletId);
      results.push(processed || nfts[i]);
      
      // Update progress every 5% or for each NFT if small batch
      if (progressCallback && (i % Math.max(1, Math.floor(total * 0.05)) === 0 || i === total - 1)) {
        progressCallback(Math.round((i + 1) / total * 100));
      }
    } catch (error) {
      logger.error('Error in batch metadata processing', { 
        index: i, 
        error: error.message,
        nft: nfts[i]?.id?.tokenId 
      });
      results.push(nfts[i]); // Keep original NFT on error
    }
  }
  
  return results;
};

/**
 * Process metadata for an entire wallet
 * @param {string} walletId - The wallet ID to process 
 * @param {Object} nftsByNetwork - NFTs organized by network
 * @param {function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Object>} - Enhanced NFTs organized by network
 */
export const processWalletMetadata = async (walletId, nftsByNetwork, progressCallback) => {
  if (!walletId || !nftsByNetwork) return nftsByNetwork;
  
  const enhancedNftsByNetwork = { ...nftsByNetwork };
  const allNetworks = Object.keys(nftsByNetwork);
  const totalNetworks = allNetworks.length;
  
  // Count total NFTs for progress calculation
  const totalNFTs = Object.values(nftsByNetwork).reduce((total, networkNFTs) => {
    return total + 
      (networkNFTs.ERC721?.length || 0) + 
      (networkNFTs.ERC1155?.length || 0);
  }, 0);
  
  let processedNFTs = 0;
  
  for (let i = 0; i < totalNetworks; i++) {
    const network = allNetworks[i];
    const networkNFTs = nftsByNetwork[network];
    
    if (!networkNFTs) continue;
    
    // Process ERC721 tokens
    if (Array.isArray(networkNFTs.ERC721) && networkNFTs.ERC721.length > 0) {
      const enhancedERC721 = await Promise.all(
        networkNFTs.ERC721.map(async (nft, index) => {
          try {
            const enhanced = await processNFTMetadata(nft, walletId);
            processedNFTs++;
            
            if (progressCallback) {
              progressCallback(Math.round(processedNFTs / totalNFTs * 100));
            }
            
            return enhanced || nft;
          } catch (error) {
            logger.error('Error processing ERC721 metadata', { 
              tokenId: nft.id?.tokenId, 
              error: error.message 
            });
            return nft;
          }
        })
      );
      
      enhancedNftsByNetwork[network].ERC721 = enhancedERC721;
    }
    
    // Process ERC1155 tokens
    if (Array.isArray(networkNFTs.ERC1155) && networkNFTs.ERC1155.length > 0) {
      const enhancedERC1155 = await Promise.all(
        networkNFTs.ERC1155.map(async (nft, index) => {
          try {
            const enhanced = await processNFTMetadata(nft, walletId);
            processedNFTs++;
            
            if (progressCallback) {
              progressCallback(Math.round(processedNFTs / totalNFTs * 100));
            }
            
            return enhanced || nft;
          } catch (error) {
            logger.error('Error processing ERC1155 metadata', { 
              tokenId: nft.id?.tokenId, 
              error: error.message 
            });
            return nft;
          }
        })
      );
      
      enhancedNftsByNetwork[network].ERC1155 = enhancedERC1155;
    }
  }
  
  return enhancedNftsByNetwork;
};