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