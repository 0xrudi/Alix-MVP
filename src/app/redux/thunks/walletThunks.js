import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNFTs } from '../../../utils/web3Utils';
import { serializeAddress, serializeNFT } from '../../../utils/serializationUtils';
import { fetchNFTsStart, fetchNFTsSuccess, fetchNFTsFailure, updateNFT, clearWalletNFTs } from '../slices/nftSlice';
import { setWallets, updateWallet, removeWallet } from '../slices/walletSlice';
import { logger } from '../../../utils/logger';
import { supabase } from '../../../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import { extractMediaInfo, MediaType } from '../../../utils/metadataProcessor';

/**
 * Fetch NFTs for a wallet with improved error handling
 * This separates the core fetching from metadata enhancement
 */
export const fetchWalletNFTs = createAsyncThunk(
  'wallets/fetchWalletNFTs',
  async ({ walletId, address, networks }, { dispatch }) => {
    dispatch(fetchNFTsStart());
    const activeNetworks = new Set();
    let totalNewNFTs = 0;
    let hasUpdates = false;
    let successfulNetworks = 0;
    let failedNetworks = 0;
    
    try {
      // Initialize the tracking structure for NFTs by network
      const nftsByNetwork = {};
      
      logger.info(`Starting NFT fetch for wallet: ${walletId}`, {
        address: typeof address === 'object' ? 'complex-address-object' : address,
        networks,
        timestamp: new Date().toISOString()
      });
      
      // Track network fetch progress
      const networkProgress = {};
      
      // Fetch NFTs for each network with controlled concurrency (2 at a time)
      const concurrency = 2;
      for (let i = 0; i < networks.length; i += concurrency) {
        const networkBatch = networks.slice(i, i + concurrency);
        const batchPromises = networkBatch.map(async (network) => {
          try {
            logger.log(`Fetching NFTs for network ${network} (batch ${Math.floor(i/concurrency) + 1})...`);
            
            // Define progress callback for this network
            const progressCallback = (update) => {
              networkProgress[network] = update;
              
              // Calculate overall progress across all networks
              const completedNetworks = Object.values(networkProgress)
                .filter(p => p.progress === 100).length;
              
              const overallProgress = Math.min(
                Math.round(
                  (Object.values(networkProgress)
                    .reduce((sum, p) => sum + (p.progress || 0), 0)) / 
                  (networks.length * 100) * 100
                ),
                99 // Cap at 99% until everything is complete
              );
              
              logger.debug(`Fetch progress: ${network} - ${update.progress}%, Overall - ${overallProgress}%`);
            };
            
            // Fetch NFTs with progress tracking
            const { nfts } = await fetchNFTs(address, network, null, 100, progressCallback);
            
            if (nfts && nfts.length > 0) {
              logger.info(`Found ${nfts.length} NFTs on network ${network}`);
              
              const processedNFTs = {
                ERC721: [],
                ERC1155: []
              };

              // Process each NFT - add walletId and separate by type
              nfts.forEach(nft => {
                try {
                  const processedNFT = serializeNFT({
                    ...nft,
                    network,
                    walletId
                  });

                  if (processedNFT) {
                    // Add to processed NFTs for Redux
                    if (processedNFT.contract?.type === 'ERC1155') {
                      processedNFTs.ERC1155.push(processedNFT);
                    } else {
                      processedNFTs.ERC721.push(processedNFT);
                    }
                  }
                } catch (error) {
                  logger.error('Error processing individual NFT:', error, { 
                    tokenId: nft.id?.tokenId, 
                    network 
                  });
                }
              });

              const totalProcessed = processedNFTs.ERC721.length + processedNFTs.ERC1155.length;
              
              if (totalProcessed > 0) {
                // Store in our network tracking structure
                nftsByNetwork[network] = processedNFTs;
                
                // Update Redux store with these NFTs immediately
                dispatch(fetchNFTsSuccess({ 
                  walletId, 
                  networkValue: network, 
                  nfts: processedNFTs
                }));
                
                activeNetworks.add(network);
                totalNewNFTs += totalProcessed;
                hasUpdates = true;
                successfulNetworks++;
              }
            } else {
              logger.debug(`No NFTs found on network ${network}`);
            }
            return { network, success: true };
          } catch (error) {
            logger.error(`Error fetching NFTs for network ${network}:`, error);
            failedNetworks++;
            dispatch(fetchNFTsFailure({ 
              walletId, 
              networkValue: network, 
              error: error.message 
            }));
            return { network, success: false, error };
          }
        });
        
        // Wait for all networks in this batch to complete
        await Promise.all(batchPromises);
        
        // Add a small delay between batches to avoid rate limiting
        if (i + concurrency < networks.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Now we have all NFTs in nftsByNetwork, but we haven't done metadata enhancement yet
      // Save the artifacts to Supabase in the background without waiting
      if (hasUpdates) {
        try {
          // Using setTimeout to let the UI update first
          setTimeout(() => {
            saveArtifactsToSupabase(walletId, nftsByNetwork)
              .catch(err => logger.error('Background artifact save error:', err));
          }, 100);
        } catch (error) {
          logger.error('Error setting up background save:', error);
        }
      }

      // Update wallet with active networks in both Redux and Supabase
      if (activeNetworks.size > 0) {
        const networkArray = Array.from(activeNetworks);
        
        // Update Redux
        dispatch(updateWallet({ 
          id: walletId, 
          networks: networkArray
        }));

        // Update Supabase
        try {
          const { error } = await supabase
            .from('wallets')
            .update({ 
              networks: networkArray,
              last_refreshed: new Date().toISOString()
            })
            .eq('id', walletId);

          if (error) {
            logger.error('Error updating wallet networks in Supabase:', error);
          }
        } catch (error) {
          logger.error('Error updating wallet networks in Supabase:', error);
        }
      }

      logger.info(`Completed NFT fetch for wallet: ${walletId}`, {
        totalNFTs: totalNewNFTs,
        activeNetworks: Array.from(activeNetworks),
        successfulNetworks,
        failedNetworks,
        hasUpdates
      });

      return {
        activeNetworks: Array.from(activeNetworks),
        hasNewNFTs: hasUpdates,
        totalNewNFTs,
        successfulNetworks,
        failedNetworks
      };
    } catch (error) {
      logger.error(`Critical error in fetchWalletNFTs:`, error);
      
      dispatch(fetchNFTsFailure({ 
        walletId, 
        error: error.message || 'Unknown error fetching NFTs'
      }));
      
      throw error;
    }
  }
);

/**
 * Save artifacts to Supabase in the background with efficient batching
 * This function doesn't block the UI and runs asynchronously
 * @param {string} walletId - The wallet ID
 * @param {Object} nftsByNetwork - NFTs organized by network
 */
async function saveArtifactsToSupabase(walletId, nftsByNetwork) {
  logger.info(`Starting background artifact save for wallet: ${walletId}`);
  const startTime = Date.now();
  
  // Flatten all NFTs into artifact format
  const allArtifactsToSave = [];
  
  // For each network
  Object.entries(nftsByNetwork).forEach(([network, networkNFTs]) => {
    // Process ERC721 tokens
    if (networkNFTs.ERC721 && networkNFTs.ERC721.length > 0) {
      networkNFTs.ERC721.forEach(nft => {
        const artifact = convertNFTToArtifactFormat(nft, walletId, network);
        if (artifact) {
          allArtifactsToSave.push(artifact);
        }
      });
    }
    
    // Process ERC1155 tokens
    if (networkNFTs.ERC1155 && networkNFTs.ERC1155.length > 0) {
      networkNFTs.ERC1155.forEach(nft => {
        const artifact = convertNFTToArtifactFormat(nft, walletId, network);
        if (artifact) {
          allArtifactsToSave.push(artifact);
        }
      });
    }
  });
  
  // Nothing to save
  if (allArtifactsToSave.length === 0) {
    logger.info(`No artifacts to save for wallet: ${walletId}`);
    return;
  }
  
  logger.info(`Saving ${allArtifactsToSave.length} artifacts for wallet: ${walletId}`);
  
  // Set a batch size for efficient saving
  const BATCH_SIZE = 50;
  const batches = [];
  
  // Split artifacts into batches
  for (let i = 0; i < allArtifactsToSave.length; i += BATCH_SIZE) {
    batches.push(allArtifactsToSave.slice(i, i + BATCH_SIZE));
  }
  
  logger.info(`Processing ${batches.length} batches for wallet: ${walletId}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    try {
      const batch = batches[i];
      
      // Build a single upsert query for the entire batch
      const { error } = await supabase
        .from('artifacts')
        .upsert(batch, { 
          onConflict: 'wallet_id,token_id,contract_address,network',
          ignoreDuplicates: false // Update if exists
        });
      
      if (error) {
        logger.error(`Error in batch ${i+1}/${batches.length}:`, error);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        logger.debug(`Successfully processed batch ${i+1}/${batches.length}`);
      }
      
      // Wait briefly between batches to avoid overwhelming the API
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    } catch (error) {
      logger.error(`Error processing batch ${i+1}/${batches.length}:`, error);
      errorCount += batches[i].length;
    }
  }
  
  const elapsed = Date.now() - startTime;
  logger.info(`Completed artifact save for wallet ${walletId}`, {
    successCount,
    errorCount,
    timeMs: elapsed,
    rate: Math.round((successCount + errorCount) / (elapsed / 1000)) + ' artifacts/sec'
  });
}

/**
 * Convert an NFT from Redux format to Supabase artifact format
 * @param {Object} nft - The NFT to convert
 * @param {string} walletId - The wallet ID
 * @param {string} network - The network
 * @returns {Object|null} Artifact format or null
 */
function convertNFTToArtifactFormat(nft, walletId, network) {
  try {
    // Basic validation
    if (!nft || !nft.id || !nft.contract) {
      return null;
    }
    
    // Convert metadata to proper format for storage
    let metadata = nft.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        logger.debug('Non-JSON metadata string', { 
          tokenId: nft.id.tokenId,
          error: e.message
        });
        // Keep as string if parse fails
      }
    }
    
    // Extract media information using our new utility
    const mediaInfo = extractMediaInfo(metadata);
    
    // Create the artifact object with enhanced media information
    return {
      wallet_id: walletId,
      token_id: nft.id.tokenId,
      contract_address: nft.contract.address,
      network: network,
      title: nft.title || `Token ID: ${nft.id.tokenId}`,
      description: nft.description || '',
      
      // Use our extracted media information
      media_url: mediaInfo.media_url || nft.media?.[0]?.gateway || '',
      cover_image_url: mediaInfo.cover_image_url || '',
      media_type: mediaInfo.media_type || null,
      additional_media: mediaInfo.additional_media || null,
      
      metadata: metadata,
      is_spam: nft.isSpam || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error converting NFT to artifact format:', error, nft);
    return null;
  }
}

/**
 * Load wallets from Supabase with error handling
 */
export const loadWallets = createAsyncThunk(
  'wallets/loadWallets',
  async (_, { dispatch }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('No authenticated user for wallet loading');
        return [];
      }

      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading wallets:', error);
        throw error;
      }

      logger.info(`Loaded ${wallets?.length || 0} wallets for user ${user.id}`);
      dispatch(setWallets(wallets || []));
      return wallets || [];
    } catch (error) {
      logger.error('Error in loadWallets:', error);
      throw error;
    }
  }
);

/**
 * Process metadata for an NFT
 * This is a separate thunk that can be triggered after initial fetching
 */
export const enhanceNFTMetadata = createAsyncThunk(
  'wallets/enhanceNFTMetadata',
  async ({ walletId, network, nft }, { dispatch }) => {
    try {
      // Import the metadata processor function dynamically
      // This avoids loading it during the initial NFT fetch
      const { processNFTMetadata } = await import('../../utils/metadataProcessor');
      
      logger.info(`Enhancing metadata for NFT: ${nft.id?.tokenId}`, {
        walletId,
        network,
        contract: nft.contract?.address
      });
      
      // Process the metadata
      const enhancedNFT = await processNFTMetadata(nft, walletId);
      
      // Check if we actually got enhanced metadata
      const wasEnhanced = 
        enhancedNFT.metadata !== nft.metadata && 
        enhancedNFT.metadata !== null;
      
      if (wasEnhanced) {
        // Update the NFT in Redux
        dispatch(updateNFT({
          walletId,
          nft: enhancedNFT
        }));
        
        logger.info(`Successfully enhanced metadata for NFT: ${nft.id?.tokenId}`);
        return { success: true, nft: enhancedNFT };
      } else {
        logger.info(`No metadata enhancement for NFT: ${nft.id?.tokenId}`);
        return { success: false, nft };
      }
    } catch (error) {
      logger.error(`Error enhancing NFT metadata:`, error);
      return { success: false, error: error.message };
    }
  }
);

/**
 * Add a new wallet and fetch its NFTs in one operation
 */
export const addWalletAndFetchNFTs = createAsyncThunk(
  'wallets/addWalletAndFetchNFTs',
  async ({ walletData, networks }, { dispatch }) => {
    try {
      logger.info(`Adding new wallet and fetching NFTs`, { 
        address: walletData.address,
        type: walletData.type,
        networks
      });
      
      // First, add the wallet to get the wallet ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      // Create wallet in Supabase
      const { data: newWallet, error } = await supabase
        .from('wallets')
        .insert([{
          user_id: user.id,
          address: walletData.address,
          nickname: walletData.nickname || null,
          type: walletData.type || 'evm',
          networks: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (error) {
        logger.error('Error creating wallet in Supabase:', error);
        throw error;
      }
      
      // Add wallet to Redux
      dispatch({
        type: 'wallets/addWallet',
        payload: newWallet
      });
      
      // Now fetch NFTs using the wallet ID
      const fetchResult = await dispatch(fetchWalletNFTs({
        walletId: newWallet.id,
        address: walletData.address,
        networks
      })).unwrap();
      
      logger.info(`Completed wallet addition and NFT fetch`, {
        walletId: newWallet.id,
        totalNFTs: fetchResult.totalNewNFTs,
        activeNetworks: fetchResult.activeNetworks
      });
      
      return {
        wallet: newWallet,
        nftResults: fetchResult
      };
    } catch (error) {
      logger.error('Error in addWalletAndFetchNFTs:', error);
      throw error;
    }
  }
);