// src/redux/thunks/artifactThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { logger } from '../../../utils/logger';
import { updateNFT, clearWalletNFTs } from '../slices/nftSlice';
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
      
      // Add to Supabase artifacts table
      const artifact = await artifactService.addArtifact(
        nft.walletId,
        nft.id.tokenId,
        nft.contract.address,
        nft.network,
        nft.metadata || {},
        nft.title || '',
        nft.description || '',
        mediaUrl
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
            is_spam: !!nft.isSpam
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
        nft: { ...nft, isSpam: newSpamStatus }
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
            isSpam: newSpamStatus 
          });
          
          await artifactService.updateSpamStatus(artifactId, newSpamStatus);
        } else {
          // Artifact doesn't exist yet, add it
          await dispatch(addArtifactToSupabase(nft));
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
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { artifactService, user } = services;
      
      logger.log('Fetching spam artifacts from Supabase');
      const spamArtifacts = await artifactService.getSpamArtifacts(user.id);
      
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