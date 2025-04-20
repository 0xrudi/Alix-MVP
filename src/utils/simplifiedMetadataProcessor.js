// src/utils/nftMetadataProcessor.js
import { logger } from './logger';
import { fieldMapping, specialTransforms } from './moralis-to-supabase-mapping';

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
    
    // Apply standard field mappings
    for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
      // Get the source value using dot notation path
      const value = getNestedValue(nft, sourceField);
      
      // Only set non-null/undefined values
      if (value !== undefined && value !== null) {
        // Check if we have a complex mapping with a transform
        if (typeof targetField === 'object' && targetField.transform) {
          // Apply the transformation function
          dbObject[targetField.target] = targetField.transform(value, dbObject);
        } else {
          // Simple direct mapping
          dbObject[targetField] = value;
        }
      }
    }
    
    // Apply special transformations for derived fields
    for (const [field, transformFn] of Object.entries(specialTransforms)) {
      // Only apply if the field doesn't already have a value
      if (!dbObject[field]) {
        const transformedValue = transformFn(nft);
        if (transformedValue !== undefined && transformedValue !== null) {
          dbObject[field] = transformedValue;
        }
      }
    }
    
    // Ensure token_id is present and is a string
    if (dbObject.token_id !== undefined) {
      dbObject.token_id = String(dbObject.token_id);
    }
    
    // Set token_standard if contract.type exists
    if (!dbObject.token_standard && nft.contract?.type) {
      dbObject.token_standard = nft.contract.type;
    }
    
    // Handle potential data cleaning/normalization
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
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} Result of database operation
 */
export const saveNFTToSupabase = async (nft, supabase) => {
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
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} Result summary
 */
export const saveBatchToSupabase = async (nfts, supabase) => {
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

export default {
  processNFTForDatabase,
  processBatchForDatabase,
  prepareForSupabaseBatch,
  saveNFTToSupabase,
  saveBatchToSupabase,
  MediaType
};