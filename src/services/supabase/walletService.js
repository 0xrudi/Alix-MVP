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
  