// src/hooks/useArtifactService.js
import { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  addArtifactToSupabase,
  batchAddArtifactsToSupabase,
  toggleArtifactSpam,
  fetchWalletArtifacts,
  syncWalletArtifacts,
  fetchSpamArtifacts,
  deleteArtifact,
  clearWalletArtifacts,
  selectArtifactByNFT
} from '../redux/thunks/artifactThunks';
import { selectSpamNFTs } from '../redux/slices/nftSlice';
import { logger } from '../../utils/logger';
import { useServices } from '../../services/service-provider';

/**
 * Custom hook for artifact management with Supabase integration
 */
export const useArtifactService = () => {
  const dispatch = useDispatch();
  const { user } = useServices();
  const spamNFTs = useSelector(selectSpamNFTs);
  
  // State to track loading/error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Load spam artifacts when the hook is first used and user is available
  useEffect(() => {
    if (user) {
      fetchSpam();
    }
  }, [user]);
  
  // Fetch spam artifacts
  const fetchSpam = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await dispatch(fetchSpamArtifacts()).unwrap();
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Failed to fetch spam artifacts');
      logger.error('Error fetching spam artifacts:', err);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
  
  // Add a single NFT to Supabase
  const addNFTToSupabase = useCallback(async (nft) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await dispatch(addArtifactToSupabase(nft)).unwrap();
      setLastUpdated(new Date().toISOString());
      
      return result.artifactId;
    } catch (err) {
      setError(err.message || 'Failed to add artifact to Supabase');
      logger.error('Error adding artifact to Supabase:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
  
  // Add multiple NFTs to Supabase in batch
  const addNFTsToSupabase = useCallback(async (nfts) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await dispatch(batchAddArtifactsToSupabase(nfts)).unwrap();
      setLastUpdated(new Date().toISOString());
      
      return result.count;
    } catch (err) {
      setError(err.message || 'Failed to add artifacts to Supabase');
      logger.error('Error adding artifacts to Supabase:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
  
  // Toggle spam status for an NFT
  const toggleSpam = useCallback(async (nft) => {
    try {
      setLoading(true);
      setError(null);
      
      await dispatch(toggleArtifactSpam(nft)).unwrap();
      setLastUpdated(new Date().toISOString());
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to toggle spam status');
      logger.error('Error toggling spam status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
  
  // Sync wallet NFTs with Supabase
  const syncWallet = useCallback(async (walletId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await dispatch(syncWalletArtifacts(walletId)).unwrap();
      setLastUpdated(new Date().toISOString());
      
      return result.added;
    } catch (err) {
      setError(err.message || 'Failed to sync wallet artifacts');
      logger.error('Error syncing wallet artifacts:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
  
  // Get all artifacts for a wallet
  const getWalletArtifacts = useCallback(async (walletId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await dispatch(fetchWalletArtifacts(walletId)).unwrap();
      setLastUpdated(new Date().toISOString());
      
      return result.artifacts;
    } catch (err) {
      setError(err.message || 'Failed to fetch wallet artifacts');
      logger.error('Error fetching wallet artifacts:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
  
  // Delete an artifact
  const removeArtifact = useCallback(async (artifactId) => {
    try {
      setLoading(true);
      setError(null);
      
      await dispatch(deleteArtifact(artifactId)).unwrap();
      setLastUpdated(new Date().toISOString());
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete artifact');
      logger.error('Error deleting artifact:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
  
  // Clear all artifacts for a wallet
  const clearWallet = useCallback(async (walletId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await dispatch(clearWalletArtifacts(walletId)).unwrap();
      setLastUpdated(new Date().toISOString());
      
      return result.count;
    } catch (err) {
      setError(err.message || 'Failed to clear wallet artifacts');
      logger.error('Error clearing wallet artifacts:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);
  
  // Get Supabase artifact ID for an NFT
  const getArtifactId = useCallback((nft) => {
    return useSelector(state => {
      const artifact = selectArtifactByNFT(state, nft);
      return artifact ? artifact.id : null;
    });
  }, []);
  
  return {
    // State
    loading,
    error,
    lastUpdated,
    spamNFTs,
    
    // Methods
    fetchSpam,
    addNFTToSupabase,
    addNFTsToSupabase,
    toggleSpam,
    syncWallet,
    getWalletArtifacts,
    removeArtifact,
    clearWallet,
    
    // Selectors
    getArtifactId
  };
};