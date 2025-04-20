// src/utils/nftDataMapper.js
import { logger } from './logger';
import { supabase } from './supabase';

/**
 * Media types that can be detected from metadata
 */
export const MediaType = {
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  ANIMATION: 'animation',
  ARTICLE: 'article',
  MODEL: '3d',
  INTERACTIVE: 'interactive',
  UNKNOWN: 'unknown'
};

/**
 * Field mapping from Moralis API response to Supabase database
 */
const fieldMapping = {
  // Core Identifiers
  'id.tokenId': 'token_id',                // The token identifier
  'contract.address': 'contract_address',  // The contract address
  'network': 'network',                    // Blockchain network
  
  // Basic Metadata
  'title': 'title',                        // NFT title (fallback to metadata.name)
  'metadata.name': 'title',                // Alternative source for title
  'description': 'description',            // NFT description (fallback to metadata.description)
  'metadata.description': 'description',   // Alternative source for description
  
  // Contract/Collection Information
  'contract.name': 'contract_name',        // Name of the contract/collection
  'contract.type': 'token_standard',       // Token standard (ERC721/ERC1155)
  'metadata.collection_name': 'collection_id', // Collection identifier
  
  // Media Information
  'media[0].gateway': 'media_url',         // Primary media URL
  'metadata.image': 'cover_image_url',     // Cover image URL
  'metadata.image_url': 'cover_image_url', // Alternative source for cover image
  
  // Ownership Information
  '_rawData.ownerOf': 'owner_address',     // Owner's wallet address
  '_rawData.amount': 'balance',            // Token amount (for ERC1155)
  
  // Blockchain Information
  '_rawData.contractType': 'token_standard', // Token standard from raw data
  '_rawData.blockNumber': 'block_number',   // Block number when minted
  '_rawData.tokenUri': 'token_uri',        // Original token URI
  
  // Status Flags
  'isSpam': 'is_spam',                     // Spam flag
  '_rawData.possibleSpam': 'is_spam',      // Alternative spam flag source
  
  // Creator Information
  'metadata.created_by': 'creator',        // Creator name from metadata
  'metadata.artist': 'creator',            // Alternative creator source
  
  // Additional Data
  'metadata': 'metadata',                  // Full metadata JSON
  'metadata.attributes': 'attributes',     // Extracted attributes
  'metadata.image_details': 'image_details', // Image dimension details
};

/**
 * Process NFT data from Moralis API and transform it into a format
 * suitable for storage in our Supabase database
 * 
 * @param {Object} nft - The NFT object from Moralis API
 * @param {string} walletId - The wallet ID in our database
 * @returns {Object} Database-ready object for Supabase
 */
export const processNFTForDatabase = (nft, walletId) => {
  if (!nft || !nft.id || !nft.contract) {
    logger.warn('Invalid NFT data for processing');
    return null;
  }
  
  try {
    // Initialize the database object with the wallet ID
    const dbObject = {
      wallet_id: walletId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_in_catalog: false // Default value
    };
    
    // Apply field mappings
    for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
      // Get the source value using dot notation path
      const value = getNestedValue(nft, sourceField);
      
      // Only set non-null/undefined values
      if (value !== undefined && value !== null) {
        dbObject[targetField] = value;
      }
    }
    
    // Apply special processing for fields that need transformation
    
    // 1. Normalize media URLs
    if (dbObject.media_url) {
      dbObject.media_url = normalizeUri(dbObject.media_url);
    }
    
    if (dbObject.cover_image_url) {
      dbObject.cover_image_url = normalizeUri(dbObject.cover_image_url);
    }
    
    // 2. Determine media_type if not already set
    if (!dbObject.media_type) {
      dbObject.media_type = determineMediaType(nft);
    }
    
    // 3. Extract additional_media information
    if (!dbObject.additional_media) {
      dbObject.additional_media = extractAdditionalMedia(nft);
    }
    
    // 4. Ensure token_id is a string
    if (dbObject.token_id !== undefined) {
      dbObject.token_id = String(dbObject.token_id);
    }
    
    // 5. Set token_standard if contract.type exists
    if (!dbObject.token_standard && nft.contract?.type) {
      dbObject.token_standard = nft.contract.type;
    }
    
    // 6. Handle balance for ERC1155 tokens
    if (nft.contract?.type === 'ERC1155' && !dbObject.balance) {
      dbObject.balance = parseInt(nft._rawData?.amount || nft.balance || '1');
    }
    
    // Cleanup and normalize the database object
    cleanupDatabaseObject(dbObject);
    
    logger.debug('Processed NFT for database', {
      tokenId: dbObject.token_id,
      contractAddress: dbObject.contract_address,
      network: dbObject.network
    });
    
    return dbObject;
  } catch (error) {
    logger.error('Error processing NFT for database:', error, {
      tokenId: nft.id?.tokenId,
      contractAddress: nft.contract?.address
    });
    return null;
  }
};

/**
 * Determine the media type based on NFT metadata
 * 
 * @param {Object} nft - The NFT object
 * @returns {string} Media type
 */
function determineMediaType(nft) {
  // If media_type is already set in the metadata, use it
  if (nft.metadata?.media?.mimeType) {
    return getMimeTypeCategory(nft.metadata.media.mimeType);
  }
  
  // Check for animation_url which often indicates non-image content
  if (nft.metadata?.animation_url) {
    // Try to guess from URL extension
    const url = nft.metadata.animation_url;
    if (url.match(/\.(mp4|webm|mov)($|\?)/i)) return MediaType.VIDEO;
    if (url.match(/\.(mp3|wav|ogg)($|\?)/i)) return MediaType.AUDIO;
    if (url.match(/\.(gltf|glb)($|\?)/i)) return MediaType.MODEL;
    return MediaType.ANIMATION;
  }
  
  // Look for explicit properties in metadata
  if (nft.metadata?.properties) {
    const props = nft.metadata.properties;
    if (props.animation_type) return props.animation_type;
    if (props.media_type) return props.media_type;
  }
  
  // Default to image if there's an image URL
  if (nft.metadata?.image || nft.media?.[0]?.gateway) {
    return MediaType.IMAGE;
  }
  
  return MediaType.UNKNOWN;
}

/**
 * Extract additional media information from NFT metadata
 * 
 * @param {Object} nft - The NFT object
 * @returns {Object|null} Additional media info
 */
function extractAdditionalMedia(nft) {
  const extras = {};
  
  // Animation URL is common for interactive/media NFTs
  if (nft.metadata?.animation_url) {
    extras.animation_url = normalizeUri(nft.metadata.animation_url);
  }
  
  // External URL for reference
  if (nft.metadata?.external_url) {
    extras.external_url = nft.metadata.external_url;
  }

  // YouTube URL for video references
  if (nft.metadata?.youtube_url) {
    extras.youtube_url = nft.metadata.youtube_url;
  }
  
  // Add any additional media from the metadata
  if (nft.metadata?.additional_media) {
    Object.assign(extras, nft.metadata.additional_media);
  }
  
  return Object.keys(extras).length > 0 ? extras : null;
}

/**
 * Process a batch of NFTs for database insertion
 * 
 * @param {Array} nfts - Array of NFT objects from Moralis API
 * @param {string} walletId - The wallet ID in our database
 * @returns {Array} Array of database-ready objects
 */
export const processBatchForDatabase = (nfts, walletId) => {
  if (!Array.isArray(nfts) || nfts.length === 0) {
    return [];
  }
  
  const processed = [];
  
  for (const nft of nfts) {
    const dbObject = processNFTForDatabase(nft, walletId);
    if (dbObject) {
      processed.push(dbObject);
    }
  }
  
  logger.info(`Processed ${processed.length} of ${nfts.length} NFTs successfully`);
  return processed;
};

/**
 * Prepare NFTs for batch upload to Supabase
 * This function creates objects suitable for Supabase's upsert operation
 * 
 * @param {Array} nfts - Array of NFT objects from Moralis API 
 * @param {string} walletId - The wallet ID
 * @param {string} network - The blockchain network
 * @returns {Array} Array of objects ready for Supabase
 */
export const prepareForSupabaseBatch = (nfts, walletId, network) => {
  const batch = [];
  
  for (const nft of nfts) {
    try {
      // Process the NFT for database
      const dbObject = processNFTForDatabase({ ...nft, network }, walletId);
      
      if (dbObject) {
        batch.push(dbObject);
      }
    } catch (error) {
      logger.error('Error preparing NFT for Supabase:', error, {
        tokenId: nft.id?.tokenId, 
        network
      });
    }
  }
  
  return batch;
};

/**
 * Save NFT data to Supabase
 * 
 * @param {Object} nft - Processed NFT object
 * @returns {Promise<Object>} Result of database operation
 */
export const saveNFTToSupabase = async (nft) => {
  try {
    // Ensure required fields are present
    if (!nft.wallet_id || !nft.token_id || !nft.contract_address || !nft.network) {
      throw new Error('Missing required fields for Supabase insertion');
    }
    
    // Upsert the NFT into the artifacts table
    const { data, error } = await supabase
      .from('artifacts')
      .upsert([nft], {
        onConflict: 'wallet_id,token_id,contract_address,network',
        returning: true
      });
    
    if (error) {
      throw error;
    }
    
    logger.debug('Saved NFT to Supabase:', {
      tokenId: nft.token_id,
      contractAddress: nft.contract_address,
      artifactId: data[0]?.id
    });
    
    return { success: true, data: data[0] };
  } catch (error) {
    logger.error('Error saving NFT to Supabase:', error, {
      tokenId: nft.token_id,
      contractAddress: nft.contract_address
    });
    return { success: false, error };
  }
};

/**
 * Save a batch of NFTs to Supabase with efficient batch processing
 * 
 * @param {Array} nfts - Array of processed NFT objects
 * @returns {Promise<Object>} Result summary
 */
export const saveBatchToSupabase = async (nfts) => {
  if (!Array.isArray(nfts) || nfts.length === 0) {
    return { success: true, inserted: 0, errors: 0 };
  }
  
  try {
    // Use batch size for efficient insertion
    const BATCH_SIZE = 50;
    let inserted = 0;
    let errors = 0;
    
    // Process in batches
    for (let i = 0; i < nfts.length; i += BATCH_SIZE) {
      const batch = nfts.slice(i, i + BATCH_SIZE);
      
      // Upsert the batch
      const { data, error } = await supabase
        .from('artifacts')
        .upsert(batch, {
          onConflict: 'wallet_id,token_id,contract_address,network',
          returning: true
        });
        
      if (error) {
        logger.error('Error in batch upsert:', error);
        errors += batch.length;
      } else {
        inserted += data?.length || 0;
        logger.debug(`Inserted/updated ${data?.length || 0} artifacts in batch ${i/BATCH_SIZE + 1}`);
      }
      
      // Add a small delay between batches to avoid overwhelming the API
      if (i + BATCH_SIZE < nfts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return { success: true, inserted, errors };
  } catch (error) {
    logger.error('Error in batch save:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Helper function to get a nested value from an object using dot notation
 * 
 * @param {Object} obj - The object to extract from
 * @param {string} path - The path in dot notation (e.g., 'a.b.c')
 * @returns {*} The value at the path or undefined
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  
  // Handle array index notation like 'media[0].gateway'
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  
  return current;
}

/**
 * Apply final cleanup and normalization to the database object
 * 
 * @param {Object} dbObject - The database object to clean
 */
function cleanupDatabaseObject(dbObject) {
  // Ensure all text fields are strings
  const textFields = ['title', 'description', 'media_url', 'cover_image_url', 
                     'token_uri', 'contract_address', 'contract_name', 'creator'];
  
  for (const field of textFields) {
    if (dbObject[field] !== undefined && dbObject[field] !== null && typeof dbObject[field] !== 'string') {
      dbObject[field] = String(dbObject[field]);
    }
  }
  
  // Ensure the metadata field is properly formatted as JSONB
  if (dbObject.metadata && typeof dbObject.metadata === 'string') {
    try {
      dbObject.metadata = JSON.parse(dbObject.metadata);
    } catch (e) {
      logger.warn('Failed to parse metadata string, keeping as object:', e);
      // If parsing fails, remove it to avoid database errors
      delete dbObject.metadata;
    }
  }
  
  // Ensure the attributes field is properly formatted as JSONB
  if (dbObject.attributes && typeof dbObject.attributes === 'string') {
    try {
      dbObject.attributes = JSON.parse(dbObject.attributes);
    } catch (e) {
      logger.warn('Failed to parse attributes string, keeping as object:', e);
      // If parsing fails, remove it to avoid database errors
      delete dbObject.attributes;
    }
  }
  
  // Ensure additional_media is properly formatted as JSONB
  if (dbObject.additional_media && typeof dbObject.additional_media === 'string') {
    try {
      dbObject.additional_media = JSON.parse(dbObject.additional_media);
    } catch (e) {
      // If parsing fails, remove it to avoid database errors
      delete dbObject.additional_media;
    }
  }
  
  // Ensure image_details is properly formatted as JSONB
  if (dbObject.image_details && typeof dbObject.image_details === 'string') {
    try {
      dbObject.image_details = JSON.parse(dbObject.image_details);
    } catch (e) {
      // If parsing fails, remove it to avoid database errors
      delete dbObject.image_details;
    }
  }
  
  // Handle null values for JSONB fields
  if (dbObject.additional_media === null) delete dbObject.additional_media;
  if (dbObject.image_details === null) delete dbObject.image_details;
  if (dbObject.attributes === null) delete dbObject.attributes;
  
  // Set default values for missing fields
  if (dbObject.balance === undefined) dbObject.balance = 1;
  if (dbObject.is_spam === undefined) dbObject.is_spam = false;
  if (dbObject.is_in_catalog === undefined) dbObject.is_in_catalog = false;
}

/**
 * Normalize URI to HTTP URL
 * Converts IPFS and Arweave URIs to HTTP URLs
 * 
 * @param {string} uri - The URI to normalize
 * @returns {string} Normalized URI
 */
export const normalizeUri = (uri) => {
  if (!uri) return null;
  
  try {
    // Handle IPFS URIs
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // Handle Arweave URIs
    if (uri.startsWith('ar://')) {
      return uri.replace('ar://', 'https://arweave.net/');
    }
    
    // Return the original URI if no conversion is needed
    return uri;
  } catch (error) {
    logger.error('Error normalizing URI:', error);
    return uri;
  }
};

/**
 * Get general media type from MIME type
 * 
 * @param {string} mimeType - MIME type string
 * @returns {string} Media type category
 */
function getMimeTypeCategory(mimeType) {
  if (!mimeType) return MediaType.UNKNOWN;
  
  if (mimeType.startsWith('image/')) return MediaType.IMAGE;
  if (mimeType.startsWith('video/')) return MediaType.VIDEO;
  if (mimeType.startsWith('audio/')) return MediaType.AUDIO;
  if (mimeType.startsWith('model/')) return MediaType.MODEL;
  if (mimeType.includes('text/html') || mimeType.includes('application/json')) return MediaType.INTERACTIVE;
  
  return MediaType.UNKNOWN;
}

export default {
  processNFTForDatabase,
  processBatchForDatabase,
  prepareForSupabaseBatch,
  saveNFTToSupabase,
  saveBatchToSupabase,
  MediaType
};