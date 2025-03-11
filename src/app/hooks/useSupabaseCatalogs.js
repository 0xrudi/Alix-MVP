// src/hooks/useSupabaseCatalogs.js
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useServices } from '../../services/service-provider';
import { fetchCatalogs, setCatalogs, selectUserCatalogs } from '../redux/slices/catalogSlice';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom hook to manage catalog integration with Supabase
 * Handles loading, creating, updating, and deleting catalogs
 */
export const useSupabaseCatalogs = () => {
  const dispatch = useDispatch();
  const { user, catalogService } = useServices();
  const catalogsFromRedux = useSelector(selectUserCatalogs);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load catalogs on component mount if user is authenticated
  useEffect(() => {
    if (user) {
      loadCatalogs();
    }
  }, [user]);

  /**
   * Load catalogs from Supabase and sync to Redux
   */
  const loadCatalogs = async () => {
    if (!user || !catalogService) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch catalogs from Supabase
      const catalogs = await catalogService.getUserCatalogs(user.id);
      
      // Update Redux state with fetched catalogs
      dispatch(setCatalogs(catalogs));
      
      logger.log('Catalogs loaded from Supabase:', { count: catalogs.length });
    } catch (err) {
      logger.error('Error loading catalogs from Supabase:', err);
      setError(err.message || 'Failed to load catalogs');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new catalog in both Redux and Supabase
   */
  const createCatalog = async (name, description = '', nftIds = []) => {
    if (!user || !catalogService) {
      setError('User not authenticated or service unavailable');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create catalog in Supabase first to get the ID
      const newCatalog = await catalogService.createCatalog(
        user.id,
        name,
        description
      );
      
      // Then update Redux with the Supabase-generated ID
      dispatch({
        type: 'catalogs/addCatalog',
        payload: {
          id: newCatalog.id,
          name,
          description,
          nftIds,
          type: 'user',
          isSystem: false,
          createdAt: newCatalog.created_at,
          updatedAt: newCatalog.updated_at
        }
      });
      
      logger.log('Catalog created in Supabase:', { id: newCatalog.id, name });
      return newCatalog.id;
    } catch (err) {
      logger.error('Error creating catalog in Supabase:', err);
      setError(err.message || 'Failed to create catalog');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update a catalog in both Redux and Supabase
   */
  const updateCatalog = async (id, updates) => {
    if (!user || !catalogService) {
      setError('User not authenticated or service unavailable');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Update in Supabase
      await catalogService.updateCatalog(id, updates);
      
      // Update in Redux
      dispatch({
        type: 'catalogs/updateCatalog',
        payload: {
          id,
          ...updates
        }
      });
      
      logger.log('Catalog updated in Supabase:', { id, updates });
      return true;
    } catch (err) {
      logger.error('Error updating catalog in Supabase:', err);
      setError(err.message || 'Failed to update catalog');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a catalog from both Redux and Supabase
   */
  const deleteCatalog = async (id) => {
    if (!user || !catalogService) {
      setError('User not authenticated or service unavailable');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Delete from Supabase
      await catalogService.deleteCatalog(id);
      
      // Delete from Redux
      dispatch({
        type: 'catalogs/removeCatalog',
        payload: id
      });
      
      logger.log('Catalog deleted from Supabase:', { id });
      return true;
    } catch (err) {
      logger.error('Error deleting catalog from Supabase:', err);
      setError(err.message || 'Failed to delete catalog');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Add an artifact to a catalog in both Redux and Supabase
   * Note: This requires the artifact to already exist in Supabase
   */
  const addArtifactToCatalog = async (catalogId, artifactId, nftData) => {
    if (!user || !catalogService) {
      setError('User not authenticated or service unavailable');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Add artifact to catalog in Supabase
      await catalogService.addArtifactToCatalog(catalogId, artifactId);
      
      // Update Redux state
      const catalog = catalogsFromRedux.find(c => c.id === catalogId);
      if (catalog) {
        const nftId = {
          tokenId: nftData.id.tokenId,
          contractAddress: nftData.contract.address,
          network: nftData.network,
          walletId: nftData.walletId
        };
        
        const updatedNftIds = [...(catalog.nftIds || []), nftId];
        
        dispatch({
          type: 'catalogs/updateCatalog',
          payload: {
            id: catalogId,
            nftIds: updatedNftIds
          }
        });
      }
      
      logger.log('Artifact added to catalog in Supabase:', { catalogId, artifactId });
      return true;
    } catch (err) {
      logger.error('Error adding artifact to catalog in Supabase:', err);
      setError(err.message || 'Failed to add artifact to catalog');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Remove an artifact from a catalog in both Redux and Supabase
   */
  const removeArtifactFromCatalog = async (catalogId, artifactId, nftData) => {
    if (!user || !catalogService) {
      setError('User not authenticated or service unavailable');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Remove artifact from catalog in Supabase
      await catalogService.removeArtifactFromCatalog(catalogId, artifactId);
      
      // Update Redux state
      const catalog = catalogsFromRedux.find(c => c.id === catalogId);
      if (catalog) {
        const nftId = {
          tokenId: nftData.id.tokenId,
          contractAddress: nftData.contract.address,
          network: nftData.network,
          walletId: nftData.walletId
        };
        
        const updatedNftIds = catalog.nftIds.filter(
          id => id.tokenId !== nftId.tokenId || 
               id.contractAddress !== nftId.contractAddress
        );
        
        dispatch({
          type: 'catalogs/updateCatalog',
          payload: {
            id: catalogId,
            nftIds: updatedNftIds
          }
        });
      }
      
      logger.log('Artifact removed from catalog in Supabase:', { catalogId, artifactId });
      return true;
    } catch (err) {
      logger.error('Error removing artifact from catalog in Supabase:', err);
      setError(err.message || 'Failed to remove artifact from catalog');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    catalogs: catalogsFromRedux,
    isLoading,
    error,
    loadCatalogs,
    createCatalog,
    updateCatalog,
    deleteCatalog,
    addArtifactToCatalog,
    removeArtifactFromCatalog
  };
};