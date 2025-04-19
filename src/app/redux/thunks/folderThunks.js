import { createAsyncThunk } from '@reduxjs/toolkit';
import { logger } from '../../../utils/logger';
import { 
  addFolder, 
  updateFolder, 
  removeFolder, 
  addCatalogToFolder,
  removeCatalogFromFolder,
  moveCatalogToFolders
} from '../slices/folderSlice';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetch all folders for the current user
 */
export const fetchUserFolders = createAsyncThunk(
  'folders/fetchUserFolders',
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
      
      logger.log('Fetching user folders from Supabase for user:', userId);
      
      // Proceed with the folder fetch
      const { data: folders, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Process folders and dispatch actions
      folders.forEach(folder => {
        dispatch(addFolder({
          id: folder.id,
          name: folder.name,
          description: folder.description || '',
          createdAt: folder.created_at,
          updatedAt: folder.updated_at
        }));
        
        // You may need to fetch relationships separately if needed
      });
      
      return folders || [];
    } catch (error) {
      logger.error('Error fetching user folders:', error);
      throw error;
    }
  }
);

/**
 * Create a new folder
 */
export const createFolder = createAsyncThunk(
  'folders/createFolder',
  async ({ name, description = '', catalogIds = [] }, { dispatch }) => {
    try {
      const { services } = window;
      
      // Generate temporary ID for immediate Redux update
      const tempId = `folder-${uuidv4()}`;
      
      // First, update Redux state with temporary ID
      dispatch(addFolder({
        id: tempId,
        name,
        description
      }));
      
      // If we have services, create folder in Supabase
      if (services && services.user) {
        const { folderService, user } = services;
        
        logger.log('Creating folder in Supabase:', { name });
        const newFolder = await folderService.createFolder(
          user.id,
          name,
          description
        );
        
        // If Supabase returns a different ID, update Redux state
        if (newFolder && newFolder.id !== tempId) {
          // Need to create a new folder with the correct ID and remove the temp one
          dispatch(addFolder({
            id: newFolder.id,
            name: newFolder.name,
            description: newFolder.description || '',
            createdAt: newFolder.created_at,
            updatedAt: newFolder.updated_at
          }));
          
          dispatch(removeFolder(tempId));
          
          // Add any catalogs to the folder
          for (const catalogId of catalogIds) {
            dispatch(addCatalogToFolder({
              folderId: newFolder.id,
              catalogId
            }));
            
            // Also add to Supabase
            try {
              await folderService.addCatalogToFolder(newFolder.id, catalogId);
            } catch (catalogError) {
              logger.error(`Error adding catalog ${catalogId} to folder:`, catalogError);
            }
          }
          
          return newFolder;
        }
      }
      
      // If we're not using Supabase or failed to create, still add catalogs to Redux
      for (const catalogId of catalogIds) {
        dispatch(addCatalogToFolder({
          folderId: tempId,
          catalogId
        }));
      }
      
      return { id: tempId, name, description };
    } catch (error) {
      logger.error('Error creating folder:', error);
      throw error;
    }
  }
);

/**
 * Update folder details
 */
export const updateFolderDetails = createAsyncThunk(
  'folders/updateFolderDetails',
  async ({ folderId, name, description, catalogIds }, { dispatch, getState }) => {
    try {
      const { services } = window;
      
      // First, update folder details in Redux
      dispatch(updateFolder({
        id: folderId,
        name,
        description
      }));
      
      // If catalog IDs are provided, update folder-catalog relationships
      if (catalogIds !== undefined) {
        // Get current catalog IDs for this folder
        const currentCatalogIds = getState().folders.relationships[folderId] || [];
        
        // Remove catalogs that are no longer in the folder
        const removedCatalogIds = currentCatalogIds.filter(id => !catalogIds.includes(id));
        for (const catalogId of removedCatalogIds) {
          dispatch(removeCatalogFromFolder({
            folderId,
            catalogId
          }));
        }
        
        // Add new catalogs to the folder
        const newCatalogIds = catalogIds.filter(id => !currentCatalogIds.includes(id));
        for (const catalogId of newCatalogIds) {
          dispatch(addCatalogToFolder({
            folderId,
            catalogId
          }));
        }
      }
      
      // If we have services, update folder in Supabase
      if (services && services.user) {
        const { folderService } = services;
        
        logger.log('Updating folder in Supabase:', { folderId, name });
        
        // Update folder details
        await folderService.updateFolder(folderId, {
          name,
          description
        });
        
        // If catalog IDs are provided, sync with Supabase
        if (catalogIds !== undefined) {
          // Get current catalog IDs for this folder
          const currentCatalogIds = getState().folders.relationships[folderId] || [];
          
          // Remove catalogs that are no longer in the folder
          const removedCatalogIds = currentCatalogIds.filter(id => !catalogIds.includes(id));
          for (const catalogId of removedCatalogIds) {
            await folderService.removeCatalogFromFolder(folderId, catalogId);
          }
          
          // Add new catalogs to the folder
          const newCatalogIds = catalogIds.filter(id => !currentCatalogIds.includes(id));
          for (const catalogId of newCatalogIds) {
            await folderService.addCatalogToFolder(folderId, catalogId);
          }
        }
      }
      
      return { folderId, name, description, catalogIds };
    } catch (error) {
      logger.error('Error updating folder:', error);
      throw error;
    }
  }
);

/**
 * Delete folder
 */
export const deleteFolder = createAsyncThunk(
  'folders/deleteFolder',
  async (folderId, { dispatch }) => {
    try {
      const { services } = window;
      
      // First, update Redux state
      dispatch(removeFolder(folderId));
      
      // If we have services, delete from Supabase
      if (services && services.user) {
        const { folderService } = services;
        
        logger.log('Deleting folder from Supabase:', { folderId });
        await folderService.deleteFolder(folderId);
      }
      
      return folderId;
    } catch (error) {
      logger.error('Error deleting folder:', error);
      throw error;
    }
  }
);

/**
 * Add catalog to folder
 */
export const addCatalogToFolderThunk = createAsyncThunk(
  'folders/addCatalogToFolderThunk',
  async ({ folderId, catalogId }, { dispatch }) => {
    try {
      const { services } = window;
      
      // First, update Redux state
      dispatch(addCatalogToFolder({
        folderId,
        catalogId
      }));
      
      // If we have services, sync with Supabase
      if (services && services.user) {
        const { folderService } = services;
        
        logger.log('Adding catalog to folder in Supabase:', { folderId, catalogId });
        await folderService.addCatalogToFolder(folderId, catalogId);
      }
      
      return { folderId, catalogId };
    } catch (error) {
      logger.error('Error adding catalog to folder:', error);
      throw error;
    }
  }
);

/**
 * Remove catalog from folder
 */
export const removeCatalogFromFolderThunk = createAsyncThunk(
  'folders/removeCatalogFromFolderThunk',
  async ({ folderId, catalogId }, { dispatch }) => {
    try {
      const { services } = window;
      
      // First, update Redux state
      dispatch(removeCatalogFromFolder({
        folderId,
        catalogId
      }));
      
      // If we have services, sync with Supabase
      if (services && services.user) {
        const { folderService } = services;
        
        logger.log('Removing catalog from folder in Supabase:', { folderId, catalogId });
        await folderService.removeCatalogFromFolder(folderId, catalogId);
      }
      
      return { folderId, catalogId };
    } catch (error) {
      logger.error('Error removing catalog from folder:', error);
      throw error;
    }
  }
);

/**
 * Move catalog to specified folders (removing from any current folders)
 */
export const moveCatalogToFoldersThunk = createAsyncThunk(
  'folders/moveCatalogToFoldersThunk',
  async ({ catalogId, folderIds }, { dispatch, getState }) => {
    try {
      const { services } = window;
      
      // First, update Redux state
      dispatch(moveCatalogToFolders({
        catalogId,
        folderIds
      }));
      
      // If we have services, sync with Supabase
      if (services && services.user) {
        const { folderService } = services;
        const relationships = getState().folders.relationships;
        
        // Find all folders that currently contain this catalog
        const currentFolderIds = Object.entries(relationships)
          .filter(([_, catalogs]) => catalogs.includes(catalogId))
          .map(([folderId]) => folderId);
        
        // Remove catalog from folders it should no longer be in
        const foldersToRemoveFrom = currentFolderIds.filter(id => !folderIds.includes(id));
        for (const folderId of foldersToRemoveFrom) {
          await folderService.removeCatalogFromFolder(folderId, catalogId);
        }
        
        // Add catalog to new folders
        const foldersToAddTo = folderIds.filter(id => !currentFolderIds.includes(id));
        for (const folderId of foldersToAddTo) {
          await folderService.addCatalogToFolder(folderId, catalogId);
        }
        
        logger.log('Moved catalog to folders in Supabase:', { catalogId, folderIds });
      }
      
      return { catalogId, folderIds };
    } catch (error) {
      logger.error('Error moving catalog to folders:', error);
      throw error;
    }
  }
);