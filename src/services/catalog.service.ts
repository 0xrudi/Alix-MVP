// src/services/catalog.service.ts
import { BaseService } from './base.service';
import { Database } from '../types/database';
import { logger } from '../utils/logger';

// Use direct types from the Database type
type Catalog = Database['public']['Tables']['catalogs']['Row'];
type Artifact = Database['public']['Tables']['artifacts']['Row'];

export class CatalogService extends BaseService {
  /**
   * Create a new catalog
   */
  async createCatalog(userId: string, name: string, description?: string): Promise<Catalog> {
    try {
      const { data, error } = await this.supabase
        .from('catalogs')
        .insert([{
          user_id: userId,
          name,
          description,
          is_system: false
        }])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create catalog');

      logger.log('Catalog created:', { name, userId });
      return data;
    } catch (error) {
      this.handleError(error, 'createCatalog');
    }
  }

  /**
   * Get all catalogs for a user
   */
  async getUserCatalogs(userId: string): Promise<Catalog[]> {
    try {
      const { data, error } = await this.supabase
        .from('catalogs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getUserCatalogs');
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
   * Add artifact to catalog
   */
  async addArtifactToCatalog(catalogId: string, artifactId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('catalog_artifacts')
        .insert([{
          catalog_id: catalogId,
          artifact_id: artifactId
        }]);

      if (error) throw error;
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