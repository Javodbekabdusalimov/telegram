import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const sendOTP = createAsyncThunk('auth/sendOTP', async (phone, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/send-otp', { phone });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error sending OTP');
  }
});

export const verifyOTP = createAsyncThunk('auth/verifyOTP', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/verify-otp', data);
    const { accessToken, refreshToken, user, isNewUser } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return { user, accessToken, isNewUser };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid OTP');
  }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken });
  } catch (err) {}
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (formData, { rejectWithValue }) => {
  try {
    const res = await api.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error updating profile');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    needsProfile: false,
    loading: false,
    isInitializing: !!localStorage.getItem('accessToken'),
    error: null,
    otpSent: false,
    otpPhone: null,
    devOtp: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    resetOtp: (state) => { state.otpSent = false; state.otpPhone = null; state.devOtp = null; },
    updateOnlineStatus: (state, action) => {
      if (state.user && state.user._id === action.payload.userId) {
        state.user.isOnline = action.payload.isOnline;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOTP.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(sendOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.devOtp = action.payload.otp || null;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyOTP.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.otpSent = false;
        if (action.payload.isNewUser) {
          state.needsProfile = true;
        } else {
          state.isAuthenticated = true;
        }
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getMe.pending, (state) => { state.loading = true; state.isInitializing = true; })
      .addCase(getMe.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitializing = false;
        state.user = action.payload;
        if (!action.payload.firstName) {
          state.needsProfile = true;
        } else {
          state.isAuthenticated = true;
        }
      })
      .addCase(getMe.rejected, (state) => {
        state.loading = false;
        state.isInitializing = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        if (state.needsProfile) {
          state.needsProfile = false;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { clearError, resetOtp, updateOnlineStatus } = authSlice.actions;
export default authSlice.reducer;
