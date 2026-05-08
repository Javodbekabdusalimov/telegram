import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchMessages = createAsyncThunk('message/fetchMessages', async ({ chatId, before }, { rejectWithValue }) => {
  try {
    const params = before ? { before } : {};
    const res = await api.get(`/chats/${chatId}/messages`, { params });
    return { chatId, messages: res.data.messages, before: !!before };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const sendMessage = createAsyncThunk('message/send', async ({ chatId, formData }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/chats/${chatId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const editMessage = createAsyncThunk('message/edit', async ({ chatId, messageId, content }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/chats/${chatId}/messages/${messageId}`, { content });
    return res.data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deleteMessage = createAsyncThunk('message/delete', async ({ chatId, messageId, forAll }, { rejectWithValue }) => {
  try {
    await api.delete(`/chats/${chatId}/messages/${messageId}`, { data: { forAll } });
    return { chatId, messageId, forAll };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const messageSlice = createSlice({
  name: 'message',
  initialState: {
    messages: {},
    loading: false,
    hasMore: {},
    replyTo: null,
    editingMessage: null,
  },
  reducers: {
    receiveMessage: (state, action) => {
      const { message, tempId } = action.payload;
      const chatId = message.chat;
      if (!state.messages[chatId]) state.messages[chatId] = [];
      if (tempId) {
        const idx = state.messages[chatId].findIndex((m) => m._id === tempId);
        if (idx > -1) {
          state.messages[chatId][idx] = message;
          return;
        }
      }
      const exists = state.messages[chatId].find((m) => m._id === message._id);
      if (!exists) state.messages[chatId].push(message);
    },
    updateMessageReactions: (state, action) => {
      const { messageId, reactions } = action.payload;
      Object.values(state.messages).forEach((msgs) => {
        const msg = msgs.find((m) => m._id === messageId);
        if (msg) msg.reactions = reactions;
      });
    },
    setReplyTo: (state, action) => { state.replyTo = action.payload; },
    setEditingMessage: (state, action) => { state.editingMessage = action.payload; },
    clearChatMessages: (state, action) => { delete state.messages[action.payload]; },
    markMessagesRead: (state, action) => {
      const { chatId, messageIds, userId } = action.payload;
      if (!state.messages[chatId]) return;
      state.messages[chatId].forEach((msg) => {
        if (messageIds.includes(msg._id)) {
          if (!msg.readBy) msg.readBy = [];
          if (!msg.readBy.find((r) => r.user === userId)) {
            msg.readBy.push({ user: userId, readAt: new Date().toISOString() });
          }
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => { state.loading = true; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, messages, before } = action.payload;
        if (before) {
          state.messages[chatId] = [...messages, ...(state.messages[chatId] || [])];
        } else {
          state.messages[chatId] = messages;
        }
        state.hasMore[chatId] = messages.length === 50;
      })
      .addCase(fetchMessages.rejected, (state) => { state.loading = false; })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const chatId = action.payload.chat;
        if (!state.messages[chatId]) state.messages[chatId] = [];
        const exists = state.messages[chatId].find((m) => m._id === action.payload._id);
        if (!exists) state.messages[chatId].push(action.payload);
      })
      .addCase(editMessage.fulfilled, (state, action) => {
        const chatId = action.payload.chat;
        if (state.messages[chatId]) {
          const idx = state.messages[chatId].findIndex((m) => m._id === action.payload._id);
          if (idx > -1) state.messages[chatId][idx] = action.payload;
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { chatId, messageId } = action.payload;
        if (state.messages[chatId]) {
          const msg = state.messages[chatId].find((m) => m._id === messageId);
          if (msg) { msg.isDeleted = true; msg.content = ''; msg.media = null; }
        }
      });
  },
});

export const {
  receiveMessage, updateMessageReactions, setReplyTo,
  setEditingMessage, clearChatMessages, markMessagesRead,
} = messageSlice.actions;
export default messageSlice.reducer;
