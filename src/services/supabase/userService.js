import { supabase } from '../../utils/supabase';
import { logger } from '../../utils/logger';

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