import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchChats = createAsyncThunk('chat/fetchChats', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/chats');
    return res.data.chats;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createPrivateChat = createAsyncThunk('chat/createPrivate', async (userId, { rejectWithValue }) => {
  try {
    const res = await api.post('/chats/private', { userId });
    return res.data.chat;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createGroupChat = createAsyncThunk('chat/createGroup', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/chats/group', data);
    return res.data.chat;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const archiveChat = createAsyncThunk('chat/archive', async ({ chatId, archive }, { rejectWithValue }) => {
  try {
    await api.put(`/chats/${chatId}/archive`, { archive });
    return { chatId, archive };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chats: [],
    activeChat: null,
    loading: false,
    error: null,
    typingUsers: {},
    onlineUsers: {},
    searchQuery: '',
  },
  reducers: {
    setActiveChat: (state, action) => { state.activeChat = action.payload; },
    setTyping: (state, action) => {
      const { chatId, userId, isTyping, firstName } = action.payload;
      if (!state.typingUsers[chatId]) state.typingUsers[chatId] = {};
      if (isTyping) {
        state.typingUsers[chatId][userId] = firstName;
      } else {
        delete state.typingUsers[chatId][userId];
      }
    },
    setOnlineStatus: (state, action) => {
      const { userId, isOnline, lastSeen } = action.payload;
      state.onlineUsers[userId] = { isOnline, lastSeen };
      state.chats.forEach((chat) => {
        chat.participants?.forEach((p) => {
          if (p.user?._id === userId) {
            p.user.isOnline = isOnline;
            if (lastSeen) p.user.lastSeen = lastSeen;
          }
        });
      });
    },
    updateLastMessage: (state, action) => {
      const { chatId, message } = action.payload;
      const chat = state.chats.find((c) => c._id === chatId);
      if (chat) {
        chat.lastMessage = message;
        chat.updatedAt = message.createdAt;
        state.chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      }
    },
    incrementUnread: (state, action) => {
      const { chatId } = action.payload;
      const chat = state.chats.find((c) => c._id === chatId);
      if (chat && chat._id !== state.activeChat?._id) {
        chat.unreadCount = (chat.unreadCount || 0) + 1;
      }
    },
    clearUnread: (state, action) => {
      const chat = state.chats.find((c) => c._id === action.payload);
      if (chat) chat.unreadCount = 0;
    },
    setSearchQuery: (state, action) => { state.searchQuery = action.payload; },
    prependChat: (state, action) => {
      const exists = state.chats.find((c) => c._id === action.payload._id);
      if (!exists) state.chats.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => { state.loading = true; })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPrivateChat.fulfilled, (state, action) => {
        const exists = state.chats.find((c) => c._id === action.payload._id);
        if (!exists) state.chats.unshift(action.payload);
        state.activeChat = action.payload;
      })
      .addCase(createGroupChat.fulfilled, (state, action) => {
        state.chats.unshift(action.payload);
        state.activeChat = action.payload;
      })
      .addCase(archiveChat.fulfilled, (state, action) => {
        const { chatId, archive } = action.payload;
        const chat = state.chats.find((c) => c._id === chatId);
        if (chat) chat.isArchived = archive;
      });
  },
});

export const {
  setActiveChat, setTyping, setOnlineStatus, updateLastMessage,
  incrementUnread, clearUnread, setSearchQuery, prependChat,
} = chatSlice.actions;
export default chatSlice.reducer;
