import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchStories = createAsyncThunk('story/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/stories');
    return res.data.stories;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createStory = createAsyncThunk('story/create', async (formData, { rejectWithValue }) => {
  try {
    const res = await api.post('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.story;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const viewStory = createAsyncThunk('story/view', async (storyId, { rejectWithValue }) => {
  try {
    await api.post(`/stories/${storyId}/view`);
    return storyId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deleteStory = createAsyncThunk('story/delete', async (storyId, { rejectWithValue }) => {
  try {
    await api.delete(`/stories/${storyId}`);
    return storyId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const storySlice = createSlice({
  name: 'story',
  initialState: {
    grouped: [],
    viewing: null,
    viewingIndex: 0,
    loading: false,
  },
  reducers: {
    setViewingStory: (state, action) => {
      state.viewing = action.payload.group;
      state.viewingIndex = action.payload.index || 0;
    },
    nextStory: (state) => {
      if (state.viewing && state.viewingIndex < state.viewing.stories.length - 1) {
        state.viewingIndex += 1;
      } else {
        state.viewing = null;
        state.viewingIndex = 0;
      }
    },
    closeStory: (state) => {
      state.viewing = null;
      state.viewingIndex = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStories.pending, (state) => { state.loading = true; })
      .addCase(fetchStories.fulfilled, (state, action) => {
        state.loading = false;
        state.grouped = action.payload;
      })
      .addCase(fetchStories.rejected, (state) => { state.loading = false; })
      .addCase(viewStory.fulfilled, (state, action) => {
        state.grouped.forEach((group) => {
          group.stories.forEach((s) => {
            if (s._id === action.payload) s.isViewed = true;
          });
          group.hasUnread = group.stories.some((s) => !s.isViewed);
        });
      })
      .addCase(deleteStory.fulfilled, (state, action) => {
        state.grouped.forEach((group) => {
          group.stories = group.stories.filter((s) => s._id !== action.payload);
        });
      });
  },
});

export const { setViewingStory, nextStory, closeStory } = storySlice.actions;
export default storySlice.reducer;
