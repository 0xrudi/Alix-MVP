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
        
        // Get auth user info from Supabase Auth
        const { data: authData } = await this.supabase.auth.getUser();
        const user = authData?.user;
        
        // Determine auth method from provider info or email
        let authMethod = 'email';
        if (user) {
          // Check for OAuth providers
          if (user.app_metadata?.provider) {
            authMethod = user.app_metadata.provider;
          } else if (user.identities && user.identities.length > 0) {
            authMethod = user.identities[0].provider;
          }
        }
        
        const { data, error } = await this.supabase
          .from('users')
          .insert([{
            id: userId,
            nickname: null,
            avatar_url: null,
            contact_email: user?.email || null,
            auth_method: authMethod
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
      throw error;
    }
  }

  /**
   * Update user profile with new fields
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      // Only update fields that are present in the updates object
      const validUpdates: Partial<{ 
        nickname: string | null; 
        avatar_url: string | null;
        contact_email: string | null;
        auth_method: string | null;
      }> = {};
      
      if ('nickname' in updates) validUpdates.nickname = updates.nickname;
      if ('avatar_url' in updates) validUpdates.avatar_url = updates.avatar_url;
      if ('contact_email' in updates) validUpdates.contact_email = updates.contact_email;
      if ('auth_method' in updates) validUpdates.auth_method = updates.auth_method;

      const { data, error } = await this.supabase
        .from('users')
        .update(validUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found');

      logger.log('User profile updated:', { userId });
      return data;
    } catch (error) {
      this.handleError(error, 'updateProfile');
      throw error;
    }
  }

  /**
   * Update user contact email
   */
  async updateContactEmail(userId: string, email: string | null): Promise<User> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          contact_email: email
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found');

      logger.log('User contact email updated:', { userId });
      return data;
    } catch (error) {
      this.handleError(error, 'updateContactEmail');
      throw error;
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      // Ensure the bucket exists first
      const { data: buckets } = await this.supabase.storage.listBuckets();
      
      // Check if avatars bucket exists
      const avatarsBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
      
      // Create bucket if it doesn't exist
      if (!avatarsBucketExists) {
        logger.log('Creating avatars bucket');
        const { error: createBucketError } = await this.supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
        });
        
        if (createBucketError) throw createBucketError;
      }
      
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
      throw error;
    }
  }
  
  /**
   * Get auth details for a user
   * Returns authentication method and contact email
   */
  async getAuthDetails(userId: string): Promise<{ auth_method: string | null, contact_email: string | null }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('auth_method, contact_email')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('User not found');
      
      return {
        auth_method: data.auth_method,
        contact_email: data.contact_email
      };
    } catch (error) {
      this.handleError(error, 'getAuthDetails');
      throw error;
    }
  }
  
  /**
   * Update auth method directly
   */
  async updateAuthMethod(userId: string, authMethod: string | null): Promise<User> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({ auth_method: authMethod })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) throw error;
      if (!data) throw new Error('User not found');
      
      logger.log('User auth method updated:', { userId, authMethod });
      return data;
    } catch (error) {
      this.handleError(error, 'updateAuthMethod');
      throw error;
    }
  }
  
  /**
   * Get all users with a specific auth method
   * Useful for analytics
   */
  async getUsersByAuthMethod(authMethod: string): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('auth_method', authMethod);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getUsersByAuthMethod');
      throw error;
    }
  }
  
  /**
   * Set initial profile after registration
   * This can be used after a new user signs up
   */
  async setInitialProfile(userId: string, profile: {
    nickname?: string | null;
    avatar_url?: string | null;
    contact_email?: string | null;
    auth_method?: string | null;
  }): Promise<User> {
    try {
      // First check if user already exists
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (existingUser) {
        // User exists, just update
        return this.updateProfile(userId, profile);
      }
      
      // Create new user profile
      const { data, error } = await this.supabase
        .from('users')
        .insert([{
          id: userId,
          nickname: profile.nickname || null,
          avatar_url: profile.avatar_url || null,
          contact_email: profile.contact_email || null,
          auth_method: profile.auth_method || 'email'
        }])
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Failed to create user profile');
      
      logger.log('Initial user profile created:', { userId });
      return data;
    } catch (error) {
      this.handleError(error, 'setInitialProfile');
      throw error;
    }
  }
}