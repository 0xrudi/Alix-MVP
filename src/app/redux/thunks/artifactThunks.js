// src/redux/thunks/artifactThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { logger } from '../../../utils/logger';
import { updateNFT, updateNFTCatalogStatus, clearWalletNFTs, updateNFTAdditionalInfo } from '../slices/nftSlice';
import { getImageUrl } from '../../../utils/web3Utils';
import { updateSpamCatalog } from '../slices/catalogSlice';
import { createSelector } from '@reduxjs/toolkit';

/**
 * Add an NFT to the Supabase artifacts table with enhanced fields
 */
export const addArtifactToSupabase = createAsyncThunk(
  'artifacts/addArtifactToSupabase',
  async (nft, { getState, dispatch }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { artifactService, user } = services;
      
      logger.log('Adding artifact to Supabase:', { 
        tokenId: nft.id?.tokenId, 
        contract: nft.contract?.address,
        creator: nft.creator || 'None',
        contractName: nft.contractName || nft.contract?.name || 'None'
      });

      // First, resolve the image URL
      let mediaUrl = null;
      try {
        mediaUrl = await getImageUrl(nft);
        if (mediaUrl === 'https://via.placeholder.com/400?text=No+Image') {
          mediaUrl = null;
        }
      } catch (imgError) {
        logger.warn('Error resolving image URL:', imgError);
      }
      
      // Extract creator if not provided
      let creator = nft.creator;
      if (!creator && nft.metadata) {
        // Simple extraction, the service will do more complex extraction
        if (nft.metadata.creator) {
          creator = typeof nft.metadata.creator === 'string' 
            ? nft.metadata.creator 
            : typeof nft.metadata.creator === 'object' && nft.metadata.creator !== null 
              ? JSON.stringify(nft.metadata.creator) 
              : null;
        }
      }
      
      // Extract contract name if not provided
      let contractName = nft.contractName || nft.contract?.name;
      if (!contractName && nft.metadata) {
        // Simple extraction, the service will do more complex extraction
        if (nft.metadata.collection && typeof nft.metadata.collection === 'object' && nft.metadata.collection.name) {
          contractName = nft.metadata.collection.name;
        }
      }
      
      // Determine if the NFT is already in a catalog or is spam
      const isInCatalog = nft.isInCatalog || nft.isSpam || false;
      
      // Add to Supabase artifacts table with new fields
      const artifact = await artifactService.addArtifact(
        nft.walletId,
        nft.id.tokenId,
        nft.contract.address,
        nft.network,
        nft.metadata || {},
        nft.title || '',
        nft.description || '',
        mediaUrl,
        nft.isSpam || false,
        isInCatalog,
        creator,
        contractName
      );
      
      // Update Redux store with additional info
      if (creator || contractName) {
        dispatch(updateNFTAdditionalInfo({
          walletId: nft.walletId,
          contractAddress: nft.contract.address,
          tokenId: nft.id.tokenId,
          network: nft.network,
          creator,
          contractName
        }));
      }
      
      return {
        nft,
        artifactId: artifact.id
      };
    } catch (error) {
      logger.error('Error adding artifact to Supabase:', error);
      throw error;
    }
  }
);

/**
 * Add multiple NFTs to Supabase in a batch operation with enhanced fields
 */
export const batchAddArtifactsToSupabase = createAsyncThunk(
  'artifacts/batchAddArtifactsToSupabase',
  async (nfts, { getState, dispatch }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { artifactService } = services;
      
      logger.log('Batch adding artifacts to Supabase:', { count: nfts.length });

      // Prepare artifacts for batch insert
      const artifacts = [];
      const additionalInfo = [];
      
      // Process each NFT
      for (const nft of nfts) {
        try {
          // Resolve image URL
          let mediaUrl = null;
          try {
            mediaUrl = await getImageUrl(nft);
            if (mediaUrl === 'https://via.placeholder.com/400?text=No+Image') {
              mediaUrl = null;
            }
          } catch (imgError) {
            logger.warn('Error resolving image URL:', imgError);
          }
          
          // Extract creator if not provided
          let creator = nft.creator;
          if (!creator && nft.metadata) {
            // Simple extraction, the service will do more complex extraction
            if (nft.metadata.creator) {
              creator = typeof nft.metadata.creator === 'string' 
                ? nft.metadata.creator 
                : typeof nft.metadata.creator === 'object' && nft.metadata.creator !== null 
                  ? JSON.stringify(nft.metadata.creator) 
                  : null;
            }
          }
          
          // Extract contract name if not provided
          let contractName = nft.contractName || nft.contract?.name;
          if (!contractName && nft.metadata) {
            // Simple extraction, the service will do more complex extraction
            if (nft.metadata.collection && typeof nft.metadata.collection === 'object' && nft.metadata.collection.name) {
              contractName = nft.metadata.collection.name;
            }
          }
          
          // Determine if the NFT is already in a catalog or is spam
          const isInCatalog = nft.isInCatalog || nft.isSpam || false;
          
          // Add to artifacts array
          artifacts.push({
            wallet_id: nft.walletId,
            token_id: nft.id.tokenId,
            contract_address: nft.contract.address,
            network: nft.network,
            metadata: nft.metadata || {},
            title: nft.title || null,
            description: nft.description || null,
            media_url: mediaUrl,
            is_spam: !!nft.isSpam,
            is_in_catalog: isInCatalog,
            creator: creator || null,
            contract_name: contractName || null
          });
          
          // Track additional info for Redux updates
          if (creator || contractName) {
            additionalInfo.push({
              walletId: nft.walletId,
              contractAddress: nft.contract.address,
              tokenId: nft.id.tokenId,
              network: nft.network,
              creator,
              contractName
            });
          }
        } catch (nftError) {
          logger.error('Error processing NFT for batch insert:', nftError, nft);
          // Continue with other NFTs
        }
      }
      
      // Perform batch insert
      const count = await artifactService.addArtifacts(artifacts);
      
      // Update Redux store with additional info
      additionalInfo.forEach(info => {
        dispatch(updateNFTAdditionalInfo(info));
      });
      
      return { count };
    } catch (error) {
      logger.error('Error batch adding artifacts to Supabase:', error);
      throw error;
    }
  }
);

/**
 * Update artifact details including creator and contract name
 */
export const updateArtifactDetails = createAsyncThunk(
  'artifacts/updateArtifactDetails',
  async ({ artifactId, updates }, { dispatch }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { artifactService } = services;
      
      logger.log('Updating artifact details:', { 
        artifactId, 
        updates
      });
      
      // Update in Supabase
      const updatedArtifact = await artifactService.updateArtifactInfo(
        artifactId,
        updates
      );
      
      // Get the wallet, contract, and token info to update Redux
      const { wallet_id, token_id, contract_address, network } = updatedArtifact;
      
      // Extract creator and contract_name for Redux update
      const { creator, contract_name } = updates;
      
      if (creator !== undefined || contract_name !== undefined) {
        // Update Redux store
        dispatch(updateNFTAdditionalInfo({
          walletId: wallet_id,
          contractAddress: contract_address,
          tokenId: token_id,
          network,
          creator,
          contractName: contract_name
        }));
      }
      
      return updatedArtifact;
    } catch (error) {
      logger.error('Error updating artifact details:', error);
      throw error;
    }
  }
);

/**
 * Toggle the spam status of an NFT and update Supabase
 */
export const toggleArtifactSpam = createAsyncThunk(
  'artifacts/toggleArtifactSpam',
  async (nft, { dispatch, getState }) => {
    try {
      const { services } = window;
      const newSpamStatus = !nft.isSpam;
      
      // First, update Redux state
      dispatch(updateNFT({
        walletId: nft.walletId,
        nft: { 
          ...nft, 
          isSpam: newSpamStatus,
          isInCatalog: newSpamStatus // If marked as spam, it's in a catalog
        }
      }));
      
      // Also update the catalog status in Redux
      dispatch(updateNFTCatalogStatus({
        walletId: nft.walletId,
        contractAddress: nft.contract.address,
        tokenId: nft.id.tokenId,
        network: nft.network,
        isInCatalog: newSpamStatus
      }));
      
      // If we have services, update in Supabase
      if (services && services.user) {
        const { artifactService } = services;
        
        // First, find the artifact ID in Supabase
        const { data: artifacts } = await services.supabase
          .from('artifacts')
          .select('id')
          .eq('wallet_id', nft.walletId)
          .eq('token_id', nft.id.tokenId)
          .eq('contract_address', nft.contract.address)
          .eq('network', nft.network);
        
        if (artifacts && artifacts.length > 0) {
          const artifactId = artifacts[0].id;
          
          logger.log('Updating artifact spam status in Supabase:', { 
            artifactId, 
            isSpam: newSpamStatus,
            isInCatalog: newSpamStatus
          });
          
          // Update both is_spam and is_in_catalog fields
          await artifactService.updateSpamStatus(artifactId, newSpamStatus, newSpamStatus);
        } else {
          // Artifact doesn't exist yet, add it
          await dispatch(addArtifactToSupabase({
            ...nft,
            isSpam: newSpamStatus,
            isInCatalog: newSpamStatus
          }));
        }
      }
      
      return { nft, isSpam: newSpamStatus };
    } catch (error) {
      logger.error('Error toggling artifact spam status:', error);
      throw error;
    }
  }
);

/**
 * Update the is_in_catalog status for an artifact
 */
export const updateArtifactCatalogStatus = createAsyncThunk(
  'artifacts/updateArtifactCatalogStatus',
  async ({ artifactId, isInCatalog }, { dispatch }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { supabase } = services;
      
      logger.log('Updating artifact catalog status in Supabase:', { 
        artifactId, 
        isInCatalog 
      });
      
      // Update the is_in_catalog field in Supabase
      const { data, error } = await supabase
        .from('artifacts')
        .update({ is_in_catalog: isInCatalog })
        .eq('id', artifactId)
        .select('wallet_id,token_id,contract_address,network');
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const artifact = data[0];
        
        // Also update the Redux state
        dispatch(updateNFTCatalogStatus({
          walletId: artifact.wallet_id,
          contractAddress: artifact.contract_address,
          tokenId: artifact.token_id,
          network: artifact.network,
          isInCatalog
        }));
      }
      
      return { artifactId, isInCatalog };
    } catch (error) {
      logger.error('Error updating artifact catalog status:', error);
      throw error;
    }
  }
);

/**
 * Fetch all artifacts for a wallet
 */
export const fetchWalletArtifacts = createAsyncThunk(
  'artifacts/fetchWalletArtifacts',
  async (walletId, { getState, dispatch }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { artifactService } = services;
      
      logger.log('Fetching wallet artifacts from Supabase:', { walletId });
      const artifacts = await artifactService.getWalletArtifacts(walletId);
      
      // Update Redux store with creator and contract_name from artifacts
      artifacts.forEach(artifact => {
        if (artifact.creator || artifact.contract_name) {
          dispatch(updateNFTAdditionalInfo({
            walletId: artifact.wallet_id,
            contractAddress: artifact.contract_address,
            tokenId: artifact.token_id,
            network: artifact.network,
            creator: artifact.creator,
            contractName: artifact.contract_name
          }));
        }
      });
      
      return {
        walletId,
        artifacts
      };
    } catch (error) {
      logger.error('Error fetching wallet artifacts:', error);
      throw error;
    }
  }
);

/**
 * Fetch all artifacts not in any catalog for the current user
 */
export const fetchArtifactsNotInCatalog = createAsyncThunk(
  'artifacts/fetchArtifactsNotInCatalog',
  async (_, { getState, dispatch }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { supabase, user } = services;
      
      logger.log('Fetching artifacts not in any catalog');
      
      // First get all wallets for the current user
      const { data: wallets, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id);
        
      if (walletError) {
        throw walletError;
      }
      
      if (!wallets || wallets.length === 0) {
        return { artifacts: [] };
      }
      
      const walletIds = wallets.map(wallet => wallet.id);
      
      // Then get all artifacts that are not in any catalog
      const { data: artifacts, error } = await supabase
        .from('artifacts')
        .select('*')
        .in('wallet_id', walletIds)
        .eq('is_in_catalog', false)
        .eq('is_spam', false);
        
      if (error) {
        throw error;
      }
      
      logger.log(`Found ${artifacts?.length || 0} artifacts not in any catalog`);
      
      // Update Redux state for each artifact
      if (artifacts && artifacts.length > 0) {
        artifacts.forEach(artifact => {
          // Update catalog status
          dispatch(updateNFTCatalogStatus({
            walletId: artifact.wallet_id,
            contractAddress: artifact.contract_address,
            tokenId: artifact.token_id,
            network: artifact.network,
            isInCatalog: false
          }));
          
          // Update creator and contract name if available
          if (artifact.creator || artifact.contract_name) {
            dispatch(updateNFTAdditionalInfo({
              walletId: artifact.wallet_id,
              contractAddress: artifact.contract_address,
              tokenId: artifact.token_id,
              network: artifact.network,
              creator: artifact.creator,
              contractName: artifact.contract_name
            }));
          }
        });
      }
      
      return { artifacts: artifacts || [] };
    } catch (error) {
      logger.error('Error fetching artifacts not in catalog:', error);
      throw error;
    }
  }
);

/**
 * Sync NFTs with Supabase artifacts
 * This adds any NFTs from Redux state that don't exist in Supabase
 */
export const syncWalletArtifacts = createAsyncThunk(
  'artifacts/syncWalletArtifacts',
  async (walletId, { dispatch, getState }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { artifactService } = services;
      
      // Get all NFTs for this wallet from Redux state
      const walletNFTs = getState().nfts.byWallet[walletId];
      if (!walletNFTs) {
        return { added: 0 };
      }
      
      // Flatten NFTs from all networks
      const nftsToAdd = [];
      Object.entries(walletNFTs).forEach(([network, networkNFTs]) => {
        const allNFTs = [
          ...(networkNFTs.ERC721 || []),
          ...(networkNFTs.ERC1155 || [])
        ];
        
        allNFTs.forEach(nft => {
          nftsToAdd.push({
            ...nft,
            walletId,
            network
          });
        });
      });
      
      // Get existing artifacts from Supabase
      const existingArtifacts = await artifactService.getWalletArtifacts(walletId);
      
      // Filter out NFTs that already exist in Supabase
      const existingKeys = new Set();
      existingArtifacts.forEach(artifact => {
        const key = `${artifact.token_id}-${artifact.contract_address}-${artifact.network}`;
        existingKeys.add(key);
      });
      
      const newNFTs = nftsToAdd.filter(nft => {
        const key = `${nft.id.tokenId}-${nft.contract.address}-${nft.network}`;
        return !existingKeys.has(key);
      });
      
      if (newNFTs.length === 0) {
        return { added: 0 };
      }
      
      // Add new NFTs to Supabase
      logger.log('Syncing new artifacts to Supabase:', { count: newNFTs.length });
      await dispatch(batchAddArtifactsToSupabase(newNFTs));
      
      return { added: newNFTs.length };
    } catch (error) {
      logger.error('Error syncing wallet artifacts:', error);
      throw error;
    }
  }
);

/**
 * Get all spam artifacts for the current user
 */
export const fetchSpamArtifacts = createAsyncThunk(
  'artifacts/fetchSpamArtifacts',
  async (_, { getState, dispatch }) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }
      
      // Access services from the window object with more robust checking
      const services = window.services || {};
      const user = services.user;
      const supabase = services.supabase;
      
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // If user is not available through services, try to get it directly from Supabase
      let userId;
      if (user?.id) {
        userId = user.id;
      } else {
        logger.warn('User ID not available, checking for auth session');
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
          throw new Error('User not authenticated');
        }
        userId = authData.user.id;
      }
      
      logger.log('Fetching spam artifacts from Supabase for user:', userId);
      
      // Query spam artifacts
      const { data: spamArtifacts, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('is_spam', true)
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }

      // Transform artifacts to NFT format and update spam catalog
      const spamNFTs = spamArtifacts.map(artifact => ({
        id: { tokenId: artifact.token_id },
        contract: { address: artifact.contract_address },
        title: artifact.title || `Token ID: ${artifact.token_id}`,
        description: artifact.description || '',
        metadata: artifact.metadata || {},
        walletId: artifact.wallet_id,
        network: artifact.network,
        isSpam: true,
        creator: artifact.creator || null,
        contractName: artifact.contract_name || null
      }));
      
      // Update spam catalog in Redux
      dispatch(updateSpamCatalog(spamNFTs));
      
      // Update NFT additional info (creator and contract name)
      spamArtifacts.forEach(artifact => {
        if (artifact.creator || artifact.contract_name) {
          dispatch(updateNFTAdditionalInfo({
            walletId: artifact.wallet_id,
            contractAddress: artifact.contract_address,
            tokenId: artifact.token_id,
            network: artifact.network,
            creator: artifact.creator,
            contractName: artifact.contract_name
          }));
        }
      });
      
      return spamNFTs;
    } catch (error) {
      logger.error('Error fetching spam artifacts:', error);
      throw error;
    }
  }
);

/**
 * Fetch artifacts with specific creator
 */
export const fetchArtifactsByCreator = createAsyncThunk(
  'artifacts/fetchArtifactsByCreator',
  async (creator, { dispatch }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { supabase, user } = services;
      
      // Get all wallets for this user
      const { data: wallets, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id);
        
      if (walletError) {
        throw walletError;
      }
      
      if (!wallets || wallets.length === 0) {
        return [];
      }
      
      const walletIds = wallets.map(wallet => wallet.id);
      
      // Query artifacts by creator
      const { data: artifacts, error } = await supabase
        .from('artifacts')
        .select('*')
        .in('wallet_id', walletIds)
        .ilike('creator', `%${creator}%`);
        
      if (error) {
        throw error;
      }
      
      // Update Redux store with these artifacts' info
      artifacts.forEach(artifact => {
        if (artifact.creator || artifact.contract_name) {
          dispatch(updateNFTAdditionalInfo({
            walletId: artifact.wallet_id,
            contractAddress: artifact.contract_address,
            tokenId: artifact.token_id,
            network: artifact.network,
            creator: artifact.creator,
            contractName: artifact.contract_name
          }));
        }
      });
      
      return artifacts || [];
    } catch (error) {
      logger.error('Error fetching artifacts by creator:', error);
      throw error;
    }
  }
);

/**
 * Update creators in bulk for artifacts that may not have them
 */
export const updateMissingCreators = createAsyncThunk(
  'artifacts/updateMissingCreators',
  async (_, { dispatch, getState }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { supabase, artifactService } = services;
      
      // Get artifacts without creators
      const { data: artifacts, error } = await supabase
        .from('artifacts')
        .select('*')
        .is('creator', null)
        .limit(100); // Process in batches
        
      if (error) {
        throw error;
      }
      
      if (!artifacts || artifacts.length === 0) {
        return { processed: 0, updated: 0 };
      }
      
      let updatedCount = 0;
      
      // Process each artifact
      for (const artifact of artifacts) {
        try {
          // Skip if there's no metadata
          if (!artifact.metadata) continue;
          
          // Extract creator and contract name using the service's utility functions
          const extractedInfo = {
            creator: artifactService.extractMediaInfo(artifact.metadata).creator,
            contract_name: artifact.contract_name
          };
          
          // Update the artifact if creator was found
          if (extractedInfo.creator) {
            const { error: updateError } = await supabase
              .from('artifacts')
              .update({ creator: extractedInfo.creator })
              .eq('id', artifact.id);
              
            if (updateError) {
              logger.error('Error updating artifact creator:', updateError);
              continue;
            }
            
            // Update Redux
            dispatch(updateNFTAdditionalInfo({
              walletId: artifact.wallet_id,
              contractAddress: artifact.contract_address,
              tokenId: artifact.token_id,
              network: artifact.network,
              creator: extractedInfo.creator,
              contractName: artifact.contract_name
            }));
            
            updatedCount++;
          }
        } catch (artifactError) {
          logger.error('Error processing artifact for creator update:', artifactError);
          // Continue with next artifact
        }
      }
      
      return { processed: artifacts.length, updated: updatedCount };
    } catch (error) {
      logger.error('Error updating missing creators:', error);
      throw error;
    }
  }
);

// Artifact-related selectors
export const selectArtifactByNFT = createSelector(
  [
    (state, nft) => state.artifacts?.items || {},
    (_, nft) => nft
  ],
  (artifacts, nft) => {
    if (!nft || !nft.id || !nft.contract) return null;
    
    // Find matching artifact
    return Object.values(artifacts).find(artifact => 
      artifact.token_id === nft.id.tokenId &&
      artifact.contract_address === nft.contract.address &&
      artifact.network === nft.network &&
      artifact.wallet_id === nft.walletId
    ) || null;
  }
);