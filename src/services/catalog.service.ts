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
   * Let Supabase generate the UUID
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
      
      // Insert catalog and let Supabase generate the UUID
      const { data, error } = await this.supabase
        .from('catalogs')
        .insert({
          // No id field - Supabase will generate UUID
          user_id: userId,
          name,
          description: description || null,
          is_system: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
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
        
        // If the error is due to RLS policies or permissions
        if (error.code === '42501' || error.message.includes('permission')) {
          logger.error('Permission error creating catalog:', { userId, name, error });
          throw new Error('You do not have permission to create catalogs');
        }
        
        // If it's a duplicate key error
        if (error.code === '23505') {
          logger.error('Duplicate catalog error:', { userId, name, error });
          throw new Error('A catalog with this name already exists');
        }
        
        throw error;
      }
      
      if (!data) throw new Error('Failed to create catalog - no data returned');

      logger.log('Catalog created:', { name, userId, id: data.id });
      return data;
    } catch (error) {
      this.handleError(error, 'createCatalog');
      throw error; // Re-throw after logging
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
   * Add artifact to catalog with improved error handling
   * Let Supabase generate UUID for the artifact if needed
   */
  async addArtifactToCatalog(catalogId: string, 
                            artifactData: {
                              token_id: string,
                              contract_address: string,
                              wallet_id: string,
                              network?: string,
                              title?: string,
                              description?: string,
                              media_url?: string,
                              metadata?: any,
                              is_spam?: boolean
                            }): Promise<string | null> {
    try {
      // First check if the artifact already exists
      const { data: existingArtifact, error: checkError } = await this.supabase
        .from('artifacts')
        .select('id')
        .eq('token_id', artifactData.token_id)
        .eq('contract_address', artifactData.contract_address)
        .eq('wallet_id', artifactData.wallet_id)
        .maybeSingle();
        
      if (checkError) {
        logger.error('Error checking existing artifact:', checkError);
      }
      
      let artifactId: string;
      
      if (existingArtifact) {
        // Use existing artifact
        artifactId = existingArtifact.id;
        logger.debug('Using existing artifact:', { artifactId });
      } else {
        // Create new artifact and let Supabase generate UUID
        const { data: newArtifact, error: createError } = await this.supabase
          .from('artifacts')
          .insert({
            // No id field - Supabase will generate UUID
            token_id: artifactData.token_id,
            contract_address: artifactData.contract_address,
            wallet_id: artifactData.wallet_id,
            network: artifactData.network || 'unknown',
            title: artifactData.title || null,
            description: artifactData.description || null,
            media_url: artifactData.media_url || null,
            metadata: artifactData.metadata || {},
            is_spam: artifactData.is_spam || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();
          
        if (createError) {
          logger.error('Error creating artifact:', createError);
          throw createError;
        }
        
        if (!newArtifact) {
          throw new Error('Failed to create artifact - no data returned');
        }
        
        artifactId = newArtifact.id;
        logger.debug('Created new artifact:', { artifactId });
      }
      
      // Check if the relationship already exists
      const { data: existingRel, error: relCheckError } = await this.supabase
        .from('catalog_artifacts')
        .select('*')
        .eq('catalog_id', catalogId)
        .eq('artifact_id', artifactId)
        .maybeSingle();
        
      if (relCheckError) {
        logger.error('Error checking catalog-artifact relationship:', relCheckError);
      }
      
      // Skip if relationship already exists
      if (existingRel) {
        logger.debug('Artifact already in catalog, skipping:', { catalogId, artifactId });
        return artifactId;
      }
      
      // Create relationship
      const { error: relError } = await this.supabase
        .from('catalog_artifacts')
        .insert({
          catalog_id: catalogId,
          artifact_id: artifactId,
          created_at: new Date().toISOString()
        });
        
      if (relError) {
        logger.error('Error creating catalog-artifact relationship:', relError);
        throw relError;
      }
      
      logger.log('Artifact added to catalog:', { catalogId, artifactId });
      return artifactId;
    } catch (error) {
      this.handleError(error, 'addArtifactToCatalog');
      return null;
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
   * Delete catalog with cascade handling
   */
  async deleteCatalog(catalogId: string): Promise<void> {
    try {
      // First delete catalog-artifact relationships
      const { error: relError } = await this.supabase
        .from('catalog_artifacts')
        .delete()
        .eq('catalog_id', catalogId);
        
      if (relError) {
        logger.error('Error deleting catalog-artifact relationships:', relError);
        // Continue with catalog deletion even if this fails
      }
      
      // Then delete catalog-folder relationships
      const { error: folderRelError } = await this.supabase
        .from('catalog_folders')
        .delete()
        .eq('catalog_id', catalogId);
        
      if (folderRelError) {
        logger.error('Error deleting catalog-folder relationships:', folderRelError);
        // Continue with catalog deletion even if this fails
      }

      // Finally delete the catalog itself
      const { error } = await this.supabase
        .from('catalogs')
        .delete()
        .eq('id', catalogId);

      if (error) {
        logger.error('Error deleting catalog:', error);
        throw error;
      }
      
      logger.log('Catalog deleted:', { catalogId });
    } catch (error) {
      this.handleError(error, 'deleteCatalog');
    }
  }
}