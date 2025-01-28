import { supabase } from '../../app/utils/supabase';
import { logger } from '../../app/utils/logger';

export const userService = {
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }
};

export const walletService = {
  async getWallets(userId) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select(`
          *,
          artifacts (*)
        `)
        .eq('user_id', userId);
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching wallets:', error);
      throw error;
    }
  },

  async addWallet(userId, walletData) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert([{
          user_id: userId,
          ...walletData
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error adding wallet:', error);
      throw error;
    }
  },

  async updateWallet(walletId, updates) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .update(updates)
        .eq('id', walletId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating wallet:', error);
      throw error;
    }
  },

  async deleteWallet(walletId) {
    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', walletId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error deleting wallet:', error);
      throw error;
    }
  }
};

export const catalogService = {
  async getCatalogs(userId) {
    try {
      const { data, error } = await supabase
        .from('catalogs')
        .select(`
          *,
          catalog_artifacts (
            artifact_id,
            artifacts (*)
          )
        `)
        .eq('user_id', userId);
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching catalogs:', error);
      throw error;
    }
  },

  async addCatalog(userId, catalogData) {
    try {
      const { data, error } = await supabase
        .from('catalogs')
        .insert([{
          user_id: userId,
          ...catalogData
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error adding catalog:', error);
      throw error;
    }
  },

  async updateCatalog(catalogId, updates) {
    try {
      const { data, error } = await supabase
        .from('catalogs')
        .update(updates)
        .eq('id', catalogId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating catalog:', error);
      throw error;
    }
  },

  async deleteCatalog(catalogId) {
    try {
      const { error } = await supabase
        .from('catalogs')
        .delete()
        .eq('id', catalogId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error deleting catalog:', error);
      throw error;
    }
  }
};

export const folderService = {
  async getFolders(userId) {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select(`
          *,
          catalog_folders (
            catalog_id,
            catalogs (*)
          )
        `)
        .eq('user_id', userId);
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching folders:', error);
      throw error;
    }
  },

  async addFolder(userId, folderData) {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          user_id: userId,
          ...folderData
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error adding folder:', error);
      throw error;
    }
  },

  async updateFolder(folderId, updates) {
    try {
      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', folderId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating folder:', error);
      throw error;
    }
  },

  async deleteFolder(folderId) {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error deleting folder:', error);
      throw error;
    }
  }
};

export const artifactService = {
  async getArtifacts(walletId) {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('wallet_id', walletId);
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching artifacts:', error);
      throw error;
    }
  },

  async addArtifact(walletId, artifactData) {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .insert([{
          wallet_id: walletId,
          ...artifactData
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error adding artifact:', error);
      throw error;
    }
  },

  async updateArtifact(artifactId, updates) {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .update(updates)
        .eq('id', artifactId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating artifact:', error);
      throw error;
    }
  },

  async deleteArtifact(artifactId) {
    try {
      const { error } = await supabase
        .from('artifacts')
        .delete()
        .eq('id', artifactId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error deleting artifact:', error);
      throw error;
    }
  }
};