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