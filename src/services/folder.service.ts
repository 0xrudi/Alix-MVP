// src/services/folder.service.ts
import { BaseService } from './base.service.ts';
import { Database } from '../types/database';
import { logger } from '../utils/logger';

// Use direct types from the Database type
type Folder = Database['public']['Tables']['folders']['Row'];
type Catalog = Database['public']['Tables']['catalogs']['Row'];

export class FolderService extends BaseService {
  /**
   * Create a new folder
   */
  async createFolder(userId: string, name: string, description?: string): Promise<Folder> {
    try {
      const { data, error } = await this.supabase
        .from('folders')
        .insert([{
          user_id: userId,
          name,
          description
        }])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create folder');

      logger.log('Folder created:', { name, userId });
      return data;
    } catch (error) {
      this.handleError(error, 'createFolder');
    }
  }

  /**
   * Get all folders for a user
   */
  async getUserFolders(userId: string): Promise<Folder[]> {
    try {
      const { data, error } = await this.supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getUserFolders');
    }
  }

  /**
   * Update folder
   */
  async updateFolder(folderId: string, updates: Partial<Folder>): Promise<Folder> {
    try {
      const { data, error } = await this.supabase
        .from('folders')
        .update(updates)
        .eq('id', folderId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Folder not found');

      logger.log('Folder updated:', { folderId, updates });
      return data;
    } catch (error) {
      this.handleError(error, 'updateFolder');
    }
  }

  /**
   * Delete folder
   */
  async deleteFolder(folderId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      logger.log('Folder deleted:', { folderId });
    } catch (error) {
      this.handleError(error, 'deleteFolder');
    }
  }

  /**
   * Add catalog to folder
   */
  async addCatalogToFolder(folderId: string, catalogId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('catalog_folders')
        .insert([{
          folder_id: folderId,
          catalog_id: catalogId
        }]);

      if (error) throw error;
      logger.log('Catalog added to folder:', { folderId, catalogId });
    } catch (error) {
      this.handleError(error, 'addCatalogToFolder');
    }
  }

  /**
   * Remove catalog from folder
   */
  async removeCatalogFromFolder(folderId: string, catalogId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('catalog_folders')
        .delete()
        .eq('folder_id', folderId)
        .eq('catalog_id', catalogId);

      if (error) throw error;
      logger.log('Catalog removed from folder:', { folderId, catalogId });
    } catch (error) {
      this.handleError(error, 'removeCatalogFromFolder');
    }
  }

  /**
   * Get catalogs in folder
   */
  async getFolderCatalogs(folderId: string): Promise<Catalog[]> {
    try {
      const { data, error } = await this.supabase
        .from('catalog_folders')
        .select('catalog_id')
        .eq('folder_id', folderId);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Fetch full catalog details for all catalog IDs
      const catalogIds = data.map(item => item.catalog_id);
      const { data: catalogs, error: catalogsError } = await this.supabase
        .from('catalogs')
        .select('*')
        .in('id', catalogIds);
        
      if (catalogsError) throw catalogsError;
      
      return catalogs || [];
    } catch (error) {
      this.handleError(error, 'getFolderCatalogs');
    }
  }
}