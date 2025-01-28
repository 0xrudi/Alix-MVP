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