import { createAsyncThunk } from '@reduxjs/toolkit';
import { logger } from '../../../utils/logger';
import { addCatalog, updateCatalog, removeCatalog } from '../slices/catalogSlice';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetch catalogs for the current user
 */
export const fetchUserCatalogs = createAsyncThunk(
  'catalogs/fetchUserCatalogs',
  async (_, { getState, dispatch }) => {
    try {
      const { services } = window;
      
      // Check if we have the services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { catalogService, user } = services;
      
      logger.log('Fetching user catalogs from Supabase');
      const catalogs = await catalogService.getUserCatalogs(user.id);
      
      // Dispatch actions to update the Redux store
      catalogs.forEach(catalog => {
        // Transform catalog data structure from Supabase to Redux format
        dispatch(addCatalog({
          id: catalog.id,
          name: catalog.name,
          description: catalog.description || '',
          nftIds: [], // We'll need a separate query to get the NFTs
          type: catalog.is_system ? 'system' : 'user',
          isSystem: catalog.is_system,
          createdAt: catalog.created_at,
          updatedAt: catalog.updated_at
        }));
      });
      
      return catalogs;
    } catch (error) {
      logger.error('Error fetching user catalogs:', error);
      throw error;
    }
  }
);

/**
 * Create a new catalog
 */
export const createNewCatalog = createAsyncThunk(
  'catalogs/createNewCatalog',
  async ({ name, description, nftIds = [] }, { dispatch }) => {
    try {
      const { services } = window;
      
      // Generate a unique ID for the catalog
      const catalogId = uuidv4();
      
      // First, update Redux state
      dispatch(addCatalog({
        id: catalogId,
        name,
        description,
        nftIds,
        type: 'user',
        isSystem: false
      }));
      
      // If we have services, sync to Supabase
      if (services && services.user) {
        const { catalogService, user } = services;
        
        logger.log('Creating catalog in Supabase:', { name });
        const newCatalog = await catalogService.createCatalog(
          user.id,
          name,
          description
        );
        
        // If Supabase returns a different ID, update Redux state
        if (newCatalog && newCatalog.id !== catalogId) {
          // Update local catalog ID to match Supabase
          dispatch(updateCatalog({
            id: catalogId,
            newId: newCatalog.id,
            name,
            nftIds
          }));
          
          // Return the new ID for any further operations
          return newCatalog.id;
        }
      }
      
      return catalogId;
    } catch (error) {
      logger.error('Error creating catalog:', error);
      throw error;
    }
  }
);

/**
 * Delete a catalog
 */
export const deleteCatalog = createAsyncThunk(
  'catalogs/deleteCatalog',
  async (catalogId, { dispatch }) => {
    try {
      const { services } = window;
      
      // First, update Redux state
      dispatch(removeCatalog(catalogId));
      
      // If we have services, sync to Supabase
      if (services && services.user) {
        const { catalogService } = services;
        
        logger.log('Deleting catalog from Supabase:', { catalogId });
        await catalogService.deleteCatalog(catalogId);
      }
      
      return catalogId;
    } catch (error) {
      logger.error('Error deleting catalog:', error);
      throw error;
    }
  }
);

/**
 * Update a catalog
 */
export const updateCatalogData = createAsyncThunk(
  'catalogs/updateCatalogData',
  async ({ id, updates }, { dispatch, getState }) => {
    try {
      const { services } = window;
      
      // First, update Redux state
      dispatch(updateCatalog({
        id,
        ...updates
      }));
      
      // If we have services, sync to Supabase
      if (services && services.user) {
        const { catalogService } = services;
        
        logger.log('Updating catalog in Supabase:', { id });
        await catalogService.updateCatalog(id, updates);
      }
      
      return { id, updates };
    } catch (error) {
      logger.error('Error updating catalog:', error);
      throw error;
    }
  }
);