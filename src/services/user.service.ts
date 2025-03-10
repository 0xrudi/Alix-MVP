// src/services/user.service.ts

import { BaseService } from './base.service.ts';
import { Database } from '../types/database';
import { logger } from '../utils/logger';

// Use direct types from the Database type
type User = Database['public']['Tables']['users']['Row'];

export class UserService extends BaseService {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<User> {
    try {
      // First check if user exists
      const { data: existingUser, error: checkError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // If no user exists, create one
      if (!existingUser) {
        logger.log('User not found, creating new profile for:', userId);
        
        const { data, error } = await this.supabase
          .from('users')
          .insert([{
            id: userId,
            nickname: null,
            avatar_url: null
          }])
          .select()
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('Failed to create user profile');
        
        return data;
      }
      
      return existingUser;
    } catch (error) {
      this.handleError(error, 'getProfile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          nickname: updates.nickname,
          avatar_url: updates.avatar_url
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found');

      logger.log('User profile updated:', { userId });
      return data;
    } catch (error) {
      this.handleError(error, 'updateProfile');
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      await this.updateProfile(userId, { avatar_url: publicUrl });

      logger.log('Avatar uploaded:', { userId, publicUrl });
      return publicUrl;
    } catch (error) {
      this.handleError(error, 'uploadAvatar');
    }
  }
}