import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchMyChannels = createAsyncThunk('channel/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/channels/my');
    return res.data.channels;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createChannel = createAsyncThunk('channel/create', async (formData, { rejectWithValue }) => {
  try {
    const res = await api.post('/channels', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.channel;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchChannelPosts = createAsyncThunk('channel/fetchPosts', async ({ channelId, page = 1 }, { rejectWithValue }) => {
  try {
    const res = await api.get(`/channels/${channelId}/posts`, { params: { page } });
    return { channelId, posts: res.data.posts };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createPost = createAsyncThunk('channel/createPost', async ({ channelId, formData }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/channels/${channelId}/posts`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { channelId, post: res.data.post };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const joinChannel = createAsyncThunk('channel/join', async (channelId, { rejectWithValue }) => {
  try {
    await api.post(`/channels/${channelId}/join`);
    return channelId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const searchChannels = createAsyncThunk('channel/search', async (q, { rejectWithValue }) => {
  try {
    const res = await api.get('/channels/search', { params: { q } });
    return res.data.channels;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const channelSlice = createSlice({
  name: 'channel',
  initialState: {
    myChannels: [],
    activeChannel: null,
    posts: {},
    searchResults: [],
    loading: false,
    error: null,
  },
  reducers: {
    setActiveChannel: (state, action) => { state.activeChannel = action.payload; },
    clearSearch: (state) => { state.searchResults = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyChannels.fulfilled, (state, action) => {
        state.myChannels = action.payload;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.myChannels.unshift(action.payload);
        state.activeChannel = action.payload;
      })
      .addCase(fetchChannelPosts.pending, (state) => { state.loading = true; })
      .addCase(fetchChannelPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts[action.payload.channelId] = action.payload.posts;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        const { channelId, post } = action.payload;
        if (!state.posts[channelId]) state.posts[channelId] = [];
        state.posts[channelId].unshift(post);
      })
      .addCase(joinChannel.fulfilled, (state, action) => {})
      .addCase(searchChannels.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      });
  },
});

export const { setActiveChannel, clearSearch } = channelSlice.actions;
export default channelSlice.reducer;
