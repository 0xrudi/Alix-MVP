// src/hooks/useWalletNFTs.js
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWalletNFTs, enhanceNFTMetadata } from '../redux/thunks/walletThunks';
import { 
  selectNFTsByWallet, 
  selectNFTsByNetwork,
  selectFlattenedWalletNFTs,
  selectNFTsLoadingState,
  selectTotalNFTs
} from '../redux/slices/nftSlice';
import { useCustomToast } from '../utils/toastUtils';
import { logger } from '../utils/logger';

/**
 * Hook for fetching and managing NFTs for wallets
 * Provides loading state, fetch functions, and selectors
 */
export const useWalletNFTs = (walletId) => {
  const dispatch = useDispatch();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  
  // Track fetch progress
  const [fetchProgress, setFetchProgress] = useState({
    isActive: false,
    overall: 0,
    byNetwork: {}
  });

  // Select relevant state from Redux
  const nftsByWallet = useSelector(state => selectNFTsByWallet(state, walletId));
  const flattenedNFTs = useSelector(state => selectFlattenedWalletNFTs(state, walletId));
  const { isLoading, error, lastUpdated } = useSelector(selectNFTsLoadingState);
  const totalNFTs = useSelector(selectTotalNFTs);
  
  /**
   * Fetch NFTs for the wallet with progress tracking
   */
  const fetchNFTs = useCallback((address, networks = []) => {
    setFetchProgress({
      isActive: true,
      overall: 0,
      byNetwork: {}
    });
    
    logger.info(`Starting NFT fetch for ${address} on ${networks.join(', ')}`);
    
    return dispatch(fetchWalletNFTs({ 
      walletId, 
      address, 
      networks 
    }))
    .unwrap()
    .then(result => {
      // Show success toast
      showSuccessToast(
        'NFTs Fetched Successfully',
        `Found ${result.totalNewNFTs} NFTs across ${result.successfulNetworks} networks.`
      );
      
      // Reset progress
      setFetchProgress({
        isActive: false,
        overall: 100,
        byNetwork: {}
      });
      
      return result;
    })
    .catch(error => {
      showErrorToast(
        'Error Fetching NFTs',
        error.message || 'Something went wrong when fetching your NFTs.'
      );
      
      // Reset progress
      setFetchProgress({
        isActive: false,
        overall: 0,
        byNetwork: {}
      });
      
      throw error;
    });
  }, [dispatch, walletId, showSuccessToast, showErrorToast]);
  
  /**
   * Enhance metadata for a specific NFT
   */
  const enhanceMetadata = useCallback((network, nft) => {
    return dispatch(enhanceNFTMetadata({
      walletId,
      network,
      nft
    }))
    .unwrap()
    .then(result => {
      if (result.success) {
        showSuccessToast(
          'Metadata Enhanced',
          'Additional metadata was found for this NFT.'
        );
      }
      return result;
    })
    .catch(error => {
      logger.error('Error enhancing metadata:', error);
      return { success: false, error };
    });
  }, [dispatch, walletId, showSuccessToast]);
  
  /**
   * Get NFTs for a specific network
   */
  const getNFTsByNetwork = useCallback((network) => {
    return useSelector(state => selectNFTsByNetwork(state, walletId, network));
  }, [walletId]);
  
  return {
    // Data
    nftsByWallet,
    flattenedNFTs,
    totalNFTs,
    
    // State
    isLoading,
    error,
    lastUpdated,
    fetchProgress,
    
    // Methods
    fetchNFTs,
    enhanceMetadata,
    getNFTsByNetwork
  };
};

export default useWalletNFTs;