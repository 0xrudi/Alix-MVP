// src/redux/slices/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: {
      id: null,
      nickname: '',
      avatarUrl: '',
    },
  },
  reducers: {
    setUserProfile: (state, action) => {
      state.profile = action.payload;
    },
    updateUserProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
  },
});

export const { setUserProfile, updateUserProfile } = userSlice.actions;
export default userSlice.reducer;