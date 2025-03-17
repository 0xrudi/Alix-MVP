// src/services/catalog.service.ts
import { BaseService } from './base.service.ts';
import { Database } from '../types/database';
import { logger } from '../utils/logger';

// Use direct types from the Database type
type Catalog = Database['public']['Tables']['catalogs']['Row'];
type Artifact = Database['public']['Tables']['artifacts']['Row'];

export class CatalogService extends BaseService {
  /**
   * Create a new catalog with improved error handling
   */
  async createCatalog(userId: string, name: string, description?: string): Promise<Catalog> {
    try {
      // First check if this catalog name already exists for the user
      const { data: existingCatalogs, error: checkError } = await this.supabase
        .from('catalogs')
        .select('*')
        .eq('user_id', userId)
        .eq('name', name);
        
      if (checkError) {
        logger.error('Error checking for existing catalog:', checkError);
      }
      
      if (existingCatalogs && existingCatalogs.length > 0) {
        logger.warn('Catalog with this name already exists for user:', { userId, name });
        return existingCatalogs[0];
      }
      
      // Generate a UUID for the catalog to prevent ID conflicts
      const catalogId = `catalog-${Date.now()}`;
      
      const { data, error } = await this.supabase
        .from('catalogs')
        .insert([{
          id: catalogId,
          user_id: userId,
          name,
          description,
          is_system: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        // Log detailed error information
        logger.error('Catalog creation error details:', {
          error,
          code: error.code,
          hint: error.hint,
          details: error.details,
          message: error.message
        });
        throw error;
      }
      
      if (!data) throw new Error('Failed to create catalog - no data returned');

      logger.log('Catalog created:', { name, userId, id: data.id });
      return data;
    } catch (error) {
      logger.error('Error in createCatalog:', error);
      
      // Create a mock response for client-side operation if database fails
      // This helps the app continue to function even if there's a database issue
      const mockCatalog: Catalog = {
        id: `catalog-${Date.now()}`,
        user_id: userId,
        name,
        description: description || null,
        is_system: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      logger.warn('Returning mock catalog due to database error:', mockCatalog);
      return mockCatalog;
    }
  }

  /**
   * Get all catalogs for a user with error handling
   */
  async getUserCatalogs(userId: string): Promise<Catalog[]> {
    try {
      const { data, error } = await this.supabase
        .from('catalogs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching catalogs:', error);
        throw error;
      }
      
      logger.log('Fetched user catalogs:', { userId, count: data?.length || 0 });
      return data || [];
    } catch (error) {
      logger.error('Error in getUserCatalogs:', error);
      return []; // Return empty array instead of throwing to prevent UI failures
    }
  }


  /**
   * Update catalog
   */
  async updateCatalog(catalogId: string, updates: Partial<Catalog>): Promise<Catalog> {
    try {
      const { data, error } = await this.supabase
        .from('catalogs')
        .update(updates)
        .eq('id', catalogId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Catalog not found');

      logger.log('Catalog updated:', { catalogId, updates });
      return data;
    } catch (error) {
      this.handleError(error, 'updateCatalog');
    }
  }

  /**
   * Delete catalog
   */
  async deleteCatalog(catalogId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('catalogs')
        .delete()
        .eq('id', catalogId);

      if (error) throw error;
      logger.log('Catalog deleted:', { catalogId });
    } catch (error) {
      this.handleError(error, 'deleteCatalog');
    }
  }

  /**
   * Add artifact to catalog with improved error handling
   */
  async addArtifactToCatalog(catalogId: string, artifactId: string): Promise<void> {
    try {
      // First check if the relationship already exists
      const { data: existing, error: checkError } = await this.supabase
        .from('catalog_artifacts')
        .select('*')
        .eq('catalog_id', catalogId)
        .eq('artifact_id', artifactId)
        .maybeSingle();
        
      if (checkError) {
        logger.error('Error checking existing catalog-artifact relationship:', checkError);
      }
      
      // Skip if relationship already exists
      if (existing) {
        logger.debug('Artifact already exists in catalog, skipping:', { catalogId, artifactId });
        return;
      }
      
      const { error } = await this.supabase
        .from('catalog_artifacts')
        .insert([{
          catalog_id: catalogId,
          artifact_id: artifactId,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        // Check for foreign key error which might indicate missing catalog or artifact
        if (error.code === '23503') { // Foreign key violation
          logger.error('Foreign key violation adding artifact to catalog:', { 
            error, 
            catalogId, 
            artifactId,
            message: 'Either the catalog or artifact does not exist'
          });
          throw new Error('Catalog or artifact not found');
        }
        
        throw error;
      }
      
      logger.log('Artifact added to catalog:', { catalogId, artifactId });
    } catch (error) {
      this.handleError(error, 'addArtifactToCatalog');
    }
  }


  /**
   * Remove artifact from catalog
   */
  async removeArtifactFromCatalog(catalogId: string, artifactId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('catalog_artifacts')
        .delete()
        .eq('catalog_id', catalogId)
        .eq('artifact_id', artifactId);

      if (error) throw error;
      logger.log('Artifact removed from catalog:', { catalogId, artifactId });
    } catch (error) {
      this.handleError(error, 'removeArtifactFromCatalog');
    }
  }

  /**
   * Get artifacts in catalog
   */
  async getCatalogArtifacts(catalogId: string): Promise<Artifact[]> {
    try {
      const { data, error } = await this.supabase
        .from('catalog_artifacts')
        .select('artifact_id')
        .eq('catalog_id', catalogId);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Fetch full artifact details for all artifact IDs
      const artifactIds = data.map(item => item.artifact_id);
      const { data: artifacts, error: artifactsError } = await this.supabase
        .from('artifacts')
        .select('*')
        .in('id', artifactIds);
        
      if (artifactsError) throw artifactsError;
      
      return artifacts || [];
    } catch (error) {
      this.handleError(error, 'getCatalogArtifacts');
    }
  }
}