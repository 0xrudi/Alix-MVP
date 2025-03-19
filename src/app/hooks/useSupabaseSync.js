// src/hooks/useSupabaseSync.js
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useServices } from '../../services/service-provider';
import { logger } from '../../utils/logger';
import { useCustomToast } from '../../utils/toastUtils';
import { fetchUserFolders } from '../redux/thunks/folderThunks';
import { fetchSpamArtifacts, syncWalletArtifacts } from '../redux/thunks/artifactThunks';
import { fetchCatalogs } from '../redux/slices/catalogSlice';

/**
 * Custom hook for syncing Supabase data with Redux state
 * This hook handles the initialization and synchronization of data
 * between Supabase and the local Redux store
 */
export const useSupabaseSync = () => {
  const dispatch = useDispatch();
  const { user } = useServices();
  const { showErrorToast } = useCustomToast();
  
  // Track sync status
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncStatus, setSyncStatus] = useState({
    folders: false,
    catalogs: false,
    artifacts: false
  });
  
  // Get wallet IDs from Redux store
  const wallets = useSelector(state => state.wallets.list || []);
  const walletIds = wallets.map(wallet => wallet.id);
  
  /**
   * Initialize app data from Supabase
   * This should be called when the app first loads or when the user changes
   */
  const initializeAppData = useCallback(async () => {
    if (!user) {
      logger.warn('Cannot initialize app data: No authenticated user');
      return;
    }
    
    try {
      setIsInitializing(true);
      setError(null);
      setSyncStatus({
        folders: false,
        catalogs: false,
        artifacts: false
      });
      
      logger.log('Initializing app data from Supabase for user:', user.id);
      
      // Step 1: Fetch folders
      try {
        await dispatch(fetchUserFolders()).unwrap();
        setSyncStatus(prev => ({ ...prev, folders: true }));
        logger.log('Folders successfully loaded');
      } catch (folderError) {
        logger.error('Error loading folders:', folderError);
        // Continue with other data fetching even if folders fail
      }
      
      // Step 2: Fetch catalogs
      try {
        await dispatch(fetchCatalogs()).unwrap();
        setSyncStatus(prev => ({ ...prev, catalogs: true }));
        logger.log('Catalogs successfully loaded');
      } catch (catalogError) {
        logger.error('Error loading catalogs:', catalogError);
        // Continue with other data fetching even if catalogs fail
      }
      
      // Step 3: Fetch spam artifacts
      try {
        await dispatch(fetchSpamArtifacts()).unwrap();
        setSyncStatus(prev => ({ ...prev, artifacts: true }));
        logger.log('Spam artifacts successfully loaded');
      } catch (artifactError) {
        logger.error('Error loading spam artifacts:', artifactError);
        // Continue even if spam artifacts fail
      }
      
      setLastSynced(new Date().toISOString());
      logger.log('Initial data sync completed');
    } catch (error) {
      setError(error.message || 'Failed to initialize app data');
      logger.error('Error initializing app data:', error);
      showErrorToast('Sync Error', 'There was a problem loading your data');
    } finally {
      setIsInitializing(false);
    }
  }, [user, dispatch, showErrorToast]);
  
  /**
   * Sync wallet NFTs with Supabase artifacts
   * This ensures all NFTs loaded from the blockchain are also in Supabase
   */
  const syncWalletData = useCallback(async (walletId) => {
    if (!user) {
      logger.warn('Cannot sync wallet data: No authenticated user');
      return;
    }
    
    try {
      setIsSyncing(true);
      
      await dispatch(syncWalletArtifacts(walletId)).unwrap();
      logger.log('Wallet artifacts synced:', walletId);
      
      setLastSynced(new Date().toISOString());
    } catch (error) {
      logger.error('Error syncing wallet data:', error);
      // Don't set error state to avoid UI disruption
    } finally {
      setIsSyncing(false);
    }
  }, [user, dispatch]);
  
  /**
   * Sync all wallets with Supabase
   * This ensures all NFTs for all wallets are also in Supabase
   */
  const syncAllWallets = useCallback(async () => {
    if (!user || walletIds.length === 0) {
      logger.warn('Cannot sync wallets: No authenticated user or no wallets');
      return;
    }
    
    try {
      setIsSyncing(true);
      
      // Sync each wallet
      for (const walletId of walletIds) {
        try {
          await syncWalletData(walletId);
        } catch (walletError) {
          logger.error(`Error syncing wallet ${walletId}:`, walletError);
          // Continue with other wallets even if one fails
        }
      }
      
      setLastSynced(new Date().toISOString());
      logger.log('All wallets synced successfully');
    } catch (error) {
      logger.error('Error syncing all wallets:', error);
      // Don't set error state to avoid UI disruption
    } finally {
      setIsSyncing(false);
    }
  }, [user, walletIds, syncWalletData]);
  
  /**
   * Refresh all app data from Supabase
   * This is useful when you want to ensure all data is fresh
   */
  const refreshAppData = useCallback(async () => {
    await initializeAppData();
    await syncAllWallets();
  }, [initializeAppData, syncAllWallets]);
  
  // Initialize app data when user changes
  useEffect(() => {
    if (user) {
      initializeAppData();
    }
  }, [user, initializeAppData]);
  
  return {
    // State
    isInitializing,
    isSyncing,
    error,
    lastSynced,
    syncStatus,
    
    // Methods
    initializeAppData,
    syncWalletData,
    syncAllWallets,
    refreshAppData
  };
}