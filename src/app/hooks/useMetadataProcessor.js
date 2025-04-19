// src/hooks/useMetadataProcessor.js
import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useCustomToast } from '../utils/toastUtils';
import { logger } from '../utils/logger';
import { updateNFT } from '../redux/slices/nftSlice';
import { processNFTMetadata, batchProcessMetadata } from '../utils/metadataProcessor';

/**
 * Hook for working with NFT metadata processing
 * Provides functions to process individual NFTs or batches
 */
export const useMetadataProcessor = () => {
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  
  // Track processing statistics
  const [processingStats, setProcessingStats] = useState({
    success: 0,
    failed: 0,
    lastRun: null,
    averageTimeMs: 0
  });
  
  // Reset error state when component unmounts or when starting new processing
  useEffect(() => {
    return () => {
      setError(null);
    };
  }, []);
  
  /**
   * Process a single NFT's metadata
   * @param {Object} nft - The NFT to process
   * @param {string} walletId - The wallet ID
   * @returns {Promise<Object>} - The processed NFT or original if processing failed
   */
  const processNFT = useCallback(async (nft, walletId) => {
    if (!nft || !nft.id || !walletId) {
      setError('Invalid NFT or wallet ID');
      return nft;
    }
    
    setIsProcessing(true);
    setError(null);
    const startTime = Date.now();
    
    try {
      logger.debug('Processing NFT metadata', {
        tokenId: nft.id.tokenId,
        contractAddress: nft.contract?.address
      });
      
      // Process the NFT's metadata
      const updatedNFT = await processNFTMetadata(nft, walletId);
      
      // Check if processing actually added anything useful
      const wasUpdated = 
        updatedNFT?.metadata !== nft.metadata && 
        updatedNFT?.metadata?.attributes && 
        (Array.isArray(updatedNFT.metadata.attributes) ? 
          updatedNFT.metadata.attributes.length > 0 : 
          Object.keys(updatedNFT.metadata.attributes).length > 0);
      
      if (wasUpdated) {
        // Update Redux store
        dispatch(updateNFT({
          walletId,
          nft: updatedNFT
        }));
        
        // Update success stats
        setProcessingStats(prev => ({
          ...prev,
          success: prev.success + 1,
          lastRun: new Date().toISOString(),
          averageTimeMs: prev.averageTimeMs === 0 ? 
            Date.now() - startTime : 
            (prev.averageTimeMs + (Date.now() - startTime)) / 2
        }));
        
        return updatedNFT;
      } else {
        // Processing didn't add useful metadata
        setProcessingStats(prev => ({
          ...prev,
          failed: prev.failed + 1,
          lastRun: new Date().toISOString()
        }));
        
        logger.debug('NFT metadata processing did not add significant data', {
          tokenId: nft.id.tokenId,
          contractAddress: nft.contract?.address
        });
        
        return nft;
      }
    } catch (err) {
      setError(err.message || 'Unknown error processing NFT');
      logger.error('Error processing NFT metadata:', err, {
        tokenId: nft.id.tokenId,
        contractAddress: nft.contract?.address
      });
      
      // Update failure stats
      setProcessingStats(prev => ({
        ...prev,
        failed: prev.failed + 1,
        lastRun: new Date().toISOString()
      }));
      
      return nft;
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);
  
  /**
   * Process metadata for multiple NFTs with progress tracking
   * @param {Array} nfts - Array of NFTs to process
   * @param {string} walletId - The wallet ID
   * @param {Object} options - Options for batch processing
   * @returns {Promise<Array>} - Array of processed NFTs
   */
  const processNFTBatch = useCallback(async (nfts, walletId, options = {}) => {
    if (!Array.isArray(nfts) || nfts.length === 0 || !walletId) {
      setError('Invalid NFTs array or wallet ID');
      return nfts;
    }
    
    const {
      concurrency = 3,
      showToasts = true,
      onComplete = null
    } = options;
    
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    const startTime = Date.now();
    
    try {
      if (showToasts) {
        showSuccessToast(
          'Processing Metadata', 
          `Processing metadata for ${nfts.length} artifacts...`
        );
      }
      
      // Process the batch with our utility function
      const results = await batchProcessMetadata(
        nfts, 
        walletId,
        // Progress callback
        (progress) => {
          setProgress(progress);
        },
        concurrency
      );
      
      // Count successes and failures
      let successCount = 0;
      let failCount = 0;
      
      results.forEach((result, index) => {
        const original = nfts[index];
        if (result.metadata !== original.metadata) {
          // Update Redux state for each successfully processed NFT
          dispatch(updateNFT({
            walletId,
            nft: result
          }));
          successCount++;
        } else {
          failCount++;
        }
      });
      
      // Update stats
      setProcessingStats(prev => ({
        success: prev.success + successCount,
        failed: prev.failed + failCount,
        lastRun: new Date().toISOString(),
        averageTimeMs: prev.averageTimeMs === 0 ? 
          (Date.now() - startTime) / nfts.length : 
          (prev.averageTimeMs + (Date.now() - startTime) / nfts.length) / 2
      }));
      
      // Show completion toast
      if (showToasts) {
        showSuccessToast(
          'Metadata Processing Complete',
          `Successfully processed metadata for ${successCount} of ${nfts.length} artifacts.`
        );
      }
      
      // Call completion callback if provided
      if (typeof onComplete === 'function') {
        onComplete(results, { success: successCount, failed: failCount });
      }
      
      return results;
    } catch (err) {
      setError(err.message || 'Error processing NFT batch');
      logger.error('Error processing NFT batch:', err);
      
      if (showToasts) {
        showErrorToast(
          'Processing Error',
          `Error processing metadata: ${err.message || 'Unknown error'}`
        );
      }
      
      return nfts; // Return original NFTs on error
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [dispatch, showSuccessToast, showErrorToast]);
  
  /**
   * Process metadata for all NFTs in a wallet
   * @param {string} walletId - The wallet ID 
   * @param {Object} nftsByNetwork - NFTs organized by network
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - NFTs by network with updated metadata
   */
  const processWalletNFTs = useCallback(async (walletId, nftsByNetwork, options = {}) => {
    if (!walletId || !nftsByNetwork) {
      setError('Invalid wallet ID or NFT data');
      return nftsByNetwork;
    }
    
    const {
      showToasts = true,
      onComplete = null
    } = options;
    
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    try {
      // Count total NFTs for better progress reporting
      const totalNFTs = Object.values(nftsByNetwork).reduce((total, networkNFTs) => {
        return total + 
          (networkNFTs.ERC721?.length || 0) + 
          (networkNFTs.ERC1155?.length || 0);
      }, 0);
      
      if (showToasts) {
        showSuccessToast(
          'Processing Wallet Metadata',
          `Processing metadata for ${totalNFTs} NFTs across ${Object.keys(nftsByNetwork).length} networks...`
        );
      }
      
      // Process all NFTs using the utility function
      const result = await processWalletMetadata(
        walletId,
        nftsByNetwork,
        // Progress callback
        (progress) => {
          setProgress(progress);
        }
      );
      
      // Count success and failure
      let successCount = 0;
      let failCount = 0;
      
      // For each network, count updated NFTs
      Object.keys(result).forEach(network => {
        const originalNetworkNFTs = nftsByNetwork[network];
        const updatedNetworkNFTs = result[network];
        
        // Count ERC721 differences
        if (originalNetworkNFTs.ERC721 && updatedNetworkNFTs.ERC721) {
          updatedNetworkNFTs.ERC721.forEach((nft, index) => {
            const original = originalNetworkNFTs.ERC721[index];
            if (nft.metadata !== original.metadata) {
              successCount++;
            } else {
              failCount++;
            }
          });
        }
        
        // Count ERC1155 differences
        if (originalNetworkNFTs.ERC1155 && updatedNetworkNFTs.ERC1155) {
          updatedNetworkNFTs.ERC1155.forEach((nft, index) => {
            const original = originalNetworkNFTs.ERC1155[index];
            if (nft.metadata !== original.metadata) {
              successCount++;
            } else {
              failCount++;
            }
          });
        }
      });
      
      // Show completion toast
      if (showToasts) {
        showSuccessToast(
          'Wallet Metadata Complete',
          `Successfully processed metadata for ${successCount} of ${totalNFTs} NFTs.`
        );
      }
      
      // Call completion callback if provided
      if (typeof onComplete === 'function') {
        onComplete(result, { success: successCount, failed: failCount });
      }
      
      return result;
    } catch (err) {
      setError(err.message || 'Error processing wallet NFTs');
      logger.error('Error processing wallet NFTs:', err);
      
      if (showToasts) {
        showErrorToast(
          'Processing Error',
          `Error processing wallet metadata: ${err.message || 'Unknown error'}`
        );
      }
      
      return nftsByNetwork; // Return original on error
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [showSuccessToast, showErrorToast]);
  
  return {
    // State
    isProcessing,
    progress,
    error,
    processingStats,
    
    // Methods
    processNFT,
    processNFTBatch,
    processWalletNFTs
  };
};

export default useMetadataProcessor;