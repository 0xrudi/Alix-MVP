import { createSlice } from '@reduxjs/toolkit';
import { logger } from '../../../utils/logger';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: {
      id: null,
      nickname: '',
      avatarUrl: '',
      contactEmail: '', // New field
      authMethod: '', // New field
    },
    isLoading: false,
    error: null,
    lastUpdated: null
  },
  reducers: {
    setUserProfile: (state, action) => {
      // Transform the Supabase profile schema to our Redux schema
      const { id, nickname, avatar_url, contact_email, auth_method } = action.payload;
      
      state.profile = {
        id: id || null,
        nickname: nickname || '',
        avatarUrl: avatar_url || '',
        contactEmail: contact_email || '',
        authMethod: auth_method || '',
      };
      
      state.lastUpdated = new Date().toISOString();
      logger.log('User profile set in Redux:', { id });
    },
    
    updateUserProfile: (state, action) => {
      state.profile = { 
        ...state.profile, 
        ...action.payload,
        // Make sure we maintain camelCase in our Redux store
        // even if the payload uses snake_case
        avatarUrl: action.payload.avatar_url || action.payload.avatarUrl || state.profile.avatarUrl,
        contactEmail: action.payload.contact_email || action.payload.contactEmail || state.profile.contactEmail,
        authMethod: action.payload.auth_method || action.payload.authMethod || state.profile.authMethod,
      };
      
      state.lastUpdated = new Date().toISOString();
      logger.log('User profile updated in Redux');
    },
    
    setProfileLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    setProfileError: (state, action) => {
      state.error = action.payload;
    },
    
    // Update just the contact email
    updateContactEmail: (state, action) => {
      state.profile.contactEmail = action.payload;
      state.lastUpdated = new Date().toISOString();
      logger.log('User contact email updated');
    },
    
    // Update just the auth method
    updateAuthMethod: (state, action) => {
      state.profile.authMethod = action.payload;
      state.lastUpdated = new Date().toISOString();
      logger.log('User auth method updated');
    },
  },
});

// Selectors
export const selectUserProfile = state => state.user.profile;
export const selectUserProfileLoading = state => state.user.isLoading;
export const selectUserProfileError = state => state.user.error;
export const selectUserLastUpdated = state => state.user.lastUpdated;

// Enhanced selector for auth details
export const selectUserAuthDetails = state => ({
  contactEmail: state.user.profile.contactEmail,
  authMethod: state.user.profile.authMethod
});

export const { 
  setUserProfile, 
  updateUserProfile, 
  setProfileLoading, 
  setProfileError,
  updateContactEmail,
  updateAuthMethod
} = userSlice.actions;

export default userSlice.reducer;