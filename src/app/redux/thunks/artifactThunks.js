// src/redux/thunks/artifactThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { logger } from '../../../utils/logger';
import { updateNFT, updateNFTCatalogStatus, clearWalletNFTs } from '../slices/nftSlice';
import { getImageUrl } from '../../../utils/web3Utils';
import { updateSpamCatalog } from '../slices/catalogSlice';
import { createSelector } from '@reduxjs/toolkit';

/**
 * Add an NFT to the Supabase artifacts table
 * This is needed before adding an NFT to a catalog
 */
export const addArtifactToSupabase = createAsyncThunk(
  'artifacts/addArtifactToSupabase',
  async (nft, { getState }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { artifactService, user } = services;
      
      logger.log('Adding artifact to Supabase:', { 
        tokenId: nft.id?.tokenId, 
        contract: nft.contract?.address 
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
      
      // Determine if the NFT is already in a catalog or is spam
      const isInCatalog = nft.isInCatalog || nft.isSpam || false;
      
      // Add to Supabase artifacts table
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
        isInCatalog
      );
      
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
 * Add multiple NFTs to Supabase in a batch operation
 */
export const batchAddArtifactsToSupabase = createAsyncThunk(
  'artifacts/batchAddArtifactsToSupabase',
  async (nfts, { getState }) => {
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
            is_in_catalog: isInCatalog
          });
        } catch (nftError) {
          logger.error('Error processing NFT for batch insert:', nftError, nft);
          // Continue with other NFTs
        }
      }
      
      // Perform batch insert
      const count = await artifactService.addArtifacts(artifacts);
      
      return { count };
    } catch (error) {
      logger.error('Error batch adding artifacts to Supabase:', error);
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
      
      // Update the spam catalog in Redux
      if (newSpamStatus) {
        const spamNFTs = getState().nfts.byWallet;
        const allSpamNFTs = [];
        
        // Collect all spam NFTs
        Object.entries(spamNFTs).forEach(([walletId, walletNFTs]) => {
          Object.entries(walletNFTs).forEach(([network, networkNFTs]) => {
            const spamERC721 = (networkNFTs.ERC721 || [])
              .filter(nft => nft.isSpam)
              .map(nft => ({ ...nft, walletId, network }));
              
            const spamERC1155 = (networkNFTs.ERC1155 || [])
              .filter(nft => nft.isSpam)
              .map(nft => ({ ...nft, walletId, network }));
              
            allSpamNFTs.push(...spamERC721, ...spamERC1155);
          });
        });
        
        // Update spam catalog
        dispatch(updateSpamCatalog(allSpamNFTs));
      }
      
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
 * Fetch all artifacts for a particular wallet
 */
export const fetchWalletArtifacts = createAsyncThunk(
  'artifacts/fetchWalletArtifacts',
  async (walletId, { getState }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { artifactService } = services;
      
      logger.log('Fetching wallet artifacts from Supabase:', { walletId });
      const artifacts = await artifactService.getWalletArtifacts(walletId);
      
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
          dispatch(updateNFTCatalogStatus({
            walletId: artifact.wallet_id,
            contractAddress: artifact.contract_address,
            tokenId: artifact.token_id,
            network: artifact.network,
            isInCatalog: false
          }));
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
        isSpam: true
      }));
      
      // Update spam catalog in Redux
      dispatch(updateSpamCatalog(spamNFTs));
      
      return spamNFTs;
    } catch (error) {
      logger.error('Error fetching spam artifacts:', error);
      throw error;
    }
  }
);

/**
 * Delete an artifact from Supabase
 * This is useful when removing an NFT from a wallet
 */
export const deleteArtifact = createAsyncThunk(
  'artifacts/deleteArtifact',
  async (artifactId, { dispatch }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { artifactService } = services;
      
      logger.log('Deleting artifact from Supabase:', { artifactId });
      await artifactService.deleteArtifact(artifactId);
      
      return artifactId;
    } catch (error) {
      logger.error('Error deleting artifact:', error);
      throw error;
    }
  }
);

/**
 * Clear all artifacts for a wallet
 * This is useful when removing a wallet from the app
 */
export const clearWalletArtifacts = createAsyncThunk(
  'artifacts/clearWalletArtifacts',
  async (walletId, { dispatch }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { artifactService } = services;
      
      // Get all artifacts for this wallet
      const artifacts = await artifactService.getWalletArtifacts(walletId);
      
      // Delete each artifact
      for (const artifact of artifacts) {
        await artifactService.deleteArtifact(artifact.id);
      }
      
      // Clear the wallet's NFTs from Redux
      dispatch(clearWalletNFTs({ walletId }));
      
      logger.log('Cleared all artifacts for wallet:', { walletId, count: artifacts.length });
      
      return { walletId, count: artifacts.length };
    } catch (error) {
      logger.error('Error clearing wallet artifacts:', error);
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