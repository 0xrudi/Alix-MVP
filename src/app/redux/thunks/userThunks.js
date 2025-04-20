// src/redux/thunks/userThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { 
  setUserProfile, 
  updateUserProfile, 
  setProfileLoading, 
  setProfileError,
  updateContactEmail,
  updateAuthMethod
} from '../slices/userSlice';
import { logger } from '../../../utils/logger';

/**
 * Fetch the user profile from Supabase
 */
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { dispatch }) => {
    try {
      dispatch(setProfileLoading(true));
      
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { userService, user } = services;
      
      // Get user profile from Supabase
      const profile = await userService.getProfile(user.id);
      
      // Set profile in Redux
      dispatch(setUserProfile(profile));
      
      dispatch(setProfileLoading(false));
      return profile;
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      dispatch(setProfileError(error.message));
      dispatch(setProfileLoading(false));
      throw error;
    }
  }
);

/**
 * Update user profile in Supabase
 */
export const updateUserProfileThunk = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData, { dispatch }) => {
    try {
      dispatch(setProfileLoading(true));
      
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { userService, user } = services;
      
      // Transform Redux camelCase to Supabase snake_case if needed
      const supabaseData = {
        nickname: profileData.nickname || undefined,
        avatar_url: profileData.avatarUrl || profileData.avatar_url || undefined,
        contact_email: profileData.contactEmail || profileData.contact_email || undefined,
        auth_method: profileData.authMethod || profileData.auth_method || undefined
      };
      
      // Filter out undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(supabaseData).filter(([_, v]) => v !== undefined)
      );
      
      // Update profile in Supabase
      const updatedProfile = await userService.updateProfile(user.id, cleanedData);
      
      // Update profile in Redux
      dispatch(updateUserProfile(cleanedData));
      
      dispatch(setProfileLoading(false));
      return updatedProfile;
    } catch (error) {
      logger.error('Error updating user profile:', error);
      dispatch(setProfileError(error.message));
      dispatch(setProfileLoading(false));
      throw error;
    }
  }
);

/**
 * Update just the contact email
 */
export const updateUserContactEmail = createAsyncThunk(
  'user/updateUserContactEmail',
  async (email, { dispatch }) => {
    try {
      dispatch(setProfileLoading(true));
      
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { userService, user } = services;
      
      // Update email in Supabase
      await userService.updateContactEmail(user.id, email);
      
      // Update email in Redux
      dispatch(updateContactEmail(email));
      
      dispatch(setProfileLoading(false));
      return { success: true, email };
    } catch (error) {
      logger.error('Error updating contact email:', error);
      dispatch(setProfileError(error.message));
      dispatch(setProfileLoading(false));
      throw error;
    }
  }
);

/**
 * Update the auth method field
 * This is typically set automatically when the user first logs in
 */
export const updateUserAuthMethod = createAsyncThunk(
  'user/updateUserAuthMethod',
  async (authMethod, { dispatch }) => {
    try {
      dispatch(setProfileLoading(true));
      
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { supabase, user } = services;
      
      // Update auth method in Supabase directly (no dedicated service method)
      const { error } = await supabase
        .from('users')
        .update({ auth_method: authMethod })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update auth method in Redux
      dispatch(updateAuthMethod(authMethod));
      
      dispatch(setProfileLoading(false));
      return { success: true, authMethod };
    } catch (error) {
      logger.error('Error updating auth method:', error);
      dispatch(setProfileError(error.message));
      dispatch(setProfileLoading(false));
      throw error;
    }
  }
);

/**
 * Fetch the user's auth details (auth method and contact email)
 */
export const fetchUserAuthDetails = createAsyncThunk(
  'user/fetchUserAuthDetails',
  async (_, { dispatch }) => {
    try {
      const { services } = window;
      
      // Check if we have services and user
      if (!services || !services.user) {
        throw new Error('User not authenticated or services not available');
      }
      
      const { userService, user } = services;
      
      // Get auth details from Supabase
      const authDetails = await userService.getAuthDetails(user.id);
      
      // Update auth details in Redux
      if (authDetails.auth_method) {
        dispatch(updateAuthMethod(authDetails.auth_method));
      }
      
      if (authDetails.contact_email) {
        dispatch(updateContactEmail(authDetails.contact_email));
      }
      
      return authDetails;
    } catch (error) {
      logger.error('Error fetching user auth details:', error);
      throw error;
    }
  }
);