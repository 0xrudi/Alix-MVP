// src/hooks/useFolderService.js
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchUserFolders,
  createFolder,
  updateFolderDetails,
  deleteFolder,
  addCatalogToFolderThunk,
  removeCatalogFromFolderThunk,
  moveCatalogToFoldersThunk
} from '../redux/thunks/folderThunks';
import { 
  selectAllFolders,
  selectFolderById,
  selectCatalogsInFolder,
  selectFoldersForCatalog,
  selectFolderLoadingState
} from '../redux/slices/folderSlice';
import { logger } from '../../utils/logger';
import { useServices } from '../../services/service-provider';

/**
 * Custom hook for folder management with Supabase integration
 * Provides methods for creating, updating, and deleting folders,
 * as well as managing folder-catalog relationships
 */
export const useFolderService = () => {
  const dispatch = useDispatch();
  const { user } = useServices();
  const folders = useSelector(selectAllFolders);
  const { loading, error, lastUpdated } = useSelector(selectFolderLoadingState);
  
  // Get the entire state to use for our selectors
  const foldersState = useSelector(state => state);
  
  // Track if initial fetch has been performed
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  
  // Load folders when the hook is first used or when user changes
  useEffect(() => {
    if (user && !initialFetchDone) {
      loadFolders();
    }
  }, [user, initialFetchDone]);
  
  // Fetch folders from Supabase and update Redux
  const loadFolders = useCallback(async () => {
    try {
      await dispatch(fetchUserFolders()).unwrap();
      setInitialFetchDone(true);
    } catch (error) {
      logger.error('Error loading folders:', error);
    }
  }, [dispatch]);
  
  // Create a new folder
  const createNewFolder = useCallback(async (name, description = '', catalogIds = []) => {
    try {
      const result = await dispatch(createFolder({
        name,
        description,
        catalogIds
      })).unwrap();
      
      return result.id;
    } catch (error) {
      logger.error('Error creating folder:', error);
      throw error;
    }
  }, [dispatch]);
  
  // Update an existing folder
  const updateFolder = useCallback(async (folderId, { name, description, catalogIds }) => {
    try {
      await dispatch(updateFolderDetails({
        folderId,
        name,
        description,
        catalogIds
      })).unwrap();
      
      return true;
    } catch (error) {
      logger.error('Error updating folder:', error);
      throw error;
    }
  }, [dispatch]);
  
  // Delete a folder
  const removeFolder = useCallback(async (folderId) => {
    try {
      await dispatch(deleteFolder(folderId)).unwrap();
      return true;
    } catch (error) {
      logger.error('Error deleting folder:', error);
      throw error;
    }
  }, [dispatch]);
  
  // Add a catalog to a folder
  const addCatalogToFolder = useCallback(async (folderId, catalogId) => {
    try {
      await dispatch(addCatalogToFolderThunk({
        folderId,
        catalogId
      })).unwrap();
      
      return true;
    } catch (error) {
      logger.error('Error adding catalog to folder:', error);
      throw error;
    }
  }, [dispatch]);
  
  // Remove a catalog from a folder
  const removeCatalogFromFolder = useCallback(async (folderId, catalogId) => {
    try {
      await dispatch(removeCatalogFromFolderThunk({
        folderId,
        catalogId
      })).unwrap();
      
      return true;
    } catch (error) {
      logger.error('Error removing catalog from folder:', error);
      throw error;
    }
  }, [dispatch]);
  
  // Move a catalog to specific folders (removing from all others)
  const moveCatalogToFolders = useCallback(async (catalogId, folderIds) => {
    try {
      await dispatch(moveCatalogToFoldersThunk({
        catalogId,
        folderIds
      })).unwrap();
      
      return true;
    } catch (error) {
      logger.error('Error moving catalog to folders:', error);
      throw error;
    }
  }, [dispatch]);
  
  // Memoized selectors that use the state captured at component render time
  // These replace the useSelector calls inside callbacks which were causing the hooks error
  
  // Get a folder by ID
  const getFolder = useCallback((folderId) => {
    return foldersState.folders?.folders?.[folderId] || null;
  }, [foldersState]);
  
  // Get catalogs in a folder
  const getCatalogsInFolder = useCallback((folderId) => {
    return foldersState.folders?.relationships?.[folderId] || [];
  }, [foldersState]);
  
  // Get folders containing a catalog
  const getFoldersForCatalog = useCallback((catalogId) => {
    if (!foldersState.folders?.relationships) return [];
    
    const folderIds = Object.entries(foldersState.folders.relationships)
      .filter(([_, catalogs]) => Array.isArray(catalogs) && catalogs.includes(catalogId))
      .map(([folderId]) => folderId);
      
    return folderIds
      .map(id => foldersState.folders.folders[id])
      .filter(Boolean);
  }, [foldersState]);
  
  return {
    // Data
    folders,
    loading,
    error,
    lastUpdated,
    initialFetchDone,
    
    // Methods
    loadFolders,
    createNewFolder,
    updateFolder,
    removeFolder,
    addCatalogToFolder,
    removeCatalogFromFolder,
    moveCatalogToFolders,
    
    // Selectors
    getFolder,
    getCatalogsInFolder,
    getFoldersForCatalog
  };
};