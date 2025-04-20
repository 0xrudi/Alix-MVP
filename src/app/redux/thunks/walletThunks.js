// src/redux/thunks/walletThunks.js - with NFT Data Mapper Integration
import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNFTs } from '../../../utils/web3Utils';
import { serializeAddress } from '../../../utils/serializationUtils';
import { fetchNFTsStart, fetchNFTsSuccess, fetchNFTsFailure, updateNFT, clearWalletNFTs } from '../slices/nftSlice';
import { setWallets, updateWallet, removeWallet } from '../slices/walletSlice';
import { logger } from '../../../utils/logger';
import { supabase } from '../../../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import nftDataMapper from '../../../utils/nftDataMapper';

/**
 * Fetch NFTs for a wallet with integration for nftDataMapper
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
              
              // For each NFT, prepare it for the database
              const processedNFTs = {
                ERC721: [],
                ERC1155: []
              };
              
              // Add network info to each NFT
              const nftsWithNetwork = nfts.map(nft => ({
                ...nft,
                network
              }));
              
              // Process each NFT using our new nftDataMapper
              const dbReadyNFTs = nftDataMapper.processBatchForDatabase(nftsWithNetwork, walletId);
              
              // Save to Supabase in the background
              if (dbReadyNFTs.length > 0) {
                nftDataMapper.saveBatchToSupabase(dbReadyNFTs)
                  .then(result => {
                    logger.info(`Saved ${result.inserted} NFTs to Supabase for ${network}`, {
                      walletId,
                      network,
                      inserted: result.inserted,
                      errors: result.errors
                    });
                  })
                  .catch(err => {
                    logger.error('Error saving NFTs to Supabase:', err);
                  });
              }
              
              // Separate by token type for Redux store
              nfts.forEach(nft => {
                // Process basic info for Redux
                const processedNFT = {
                  ...nft,
                  network,
                  walletId,
                  isInCatalog: nft.isInCatalog || nft.isSpam || false
                };
                
                // Add to the appropriate array based on token type
                if (nft.contract?.type === 'ERC1155') {
                  processedNFTs.ERC1155.push(processedNFT);
                } else {
                  processedNFTs.ERC721.push(processedNFT);
                }
              });
              
              // Store in our network tracking structure
              nftsByNetwork[network] = processedNFTs;
              
              // Update Redux store with these NFTs immediately
              dispatch(fetchNFTsSuccess({ 
                walletId, 
                networkValue: network, 
                nfts: processedNFTs
              }));
              
              activeNetworks.add(network);
              totalNewNFTs += processedNFTs.ERC721.length + processedNFTs.ERC1155.length;
              hasUpdates = true;
              successfulNetworks++;
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
 * Add a new wallet and fetch its NFTs in one operation
 * Integrated with nftDataMapper for database storage
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

/**
 * Process metadata for an NFT
 * This is a separate thunk that can be triggered after initial fetching
 */
export const enhanceNFTMetadata = createAsyncThunk(
  'wallets/enhanceNFTMetadata',
  async ({ walletId, network, nft }, { dispatch }) => {
    try {
      logger.info(`Enhancing metadata for NFT: ${nft.id?.tokenId}`, {
        walletId,
        network,
        contract: nft.contract?.address
      });
      
      // Use our nftDataMapper to process the NFT for database
      const processedNFT = nftDataMapper.processNFTForDatabase({
        ...nft,
        network
      }, walletId);
      
      if (processedNFT) {
        // Save to Supabase
        const saveResult = await nftDataMapper.saveNFTToSupabase(processedNFT);
        
        if (saveResult.success) {
          // Get the enhanced NFT with additional data
          const enhancedNFT = {
            ...nft,
            media_url: processedNFT.media_url || nft.media_url,
            cover_image_url: processedNFT.cover_image_url || nft.cover_image_url,
            media_type: processedNFT.media_type || nft.media_type,
            title: processedNFT.title || nft.title,
            description: processedNFT.description || nft.description,
            additional_media: processedNFT.additional_media || nft.additional_media,
            attributes: processedNFT.attributes || nft.attributes,
            creator: processedNFT.creator || nft.creator
          };
          
          // Update the NFT in Redux
          dispatch(updateNFT({
            walletId,
            nft: enhancedNFT
          }));
          
          logger.info(`Successfully enhanced metadata for NFT: ${nft.id?.tokenId}`);
          return { success: true, nft: enhancedNFT };
        }
      }
      
      logger.info(`No metadata enhancement for NFT: ${nft.id?.tokenId}`);
      return { success: false, nft };
    } catch (error) {
      logger.error(`Error enhancing NFT metadata:`, error);
      return { success: false, error: error.message };
    }
  }
);

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