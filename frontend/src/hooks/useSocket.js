import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initSocket, disconnectSocket, getSocket } from '../socket';
import { receiveMessage, updateMessageReactions, markMessagesRead, fetchMessages } from '../store/slices/messageSlice';
import { setTyping, setOnlineStatus, updateLastMessage, incrementUnread, fetchChats } from '../store/slices/chatSlice';
import { setIncomingCall } from '../store/slices/uiSlice';

export const useSocket = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { activeChat } = useSelector((s) => s.chat);
  const activeChatRef = useRef(activeChat);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    const socket = initSocket(token);

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('message:new', ({ message, tempId }) => {
      dispatch(receiveMessage({ message, tempId }));
      dispatch(updateLastMessage({ chatId: message.chat, message }));
      if (activeChatRef.current?._id !== message.chat) {
        dispatch(incrementUnread({ chatId: message.chat }));
      } else {
        // Refresh messages in active chat so new messages appear instantly
        dispatch(fetchMessages({ chatId: message.chat }));
      }
    });

    socket.on('message:typing', (data) => {
      dispatch(setTyping(data));
    });

    socket.on('message:reacted', ({ messageId, reactions }) => {
      dispatch(updateMessageReactions({ messageId, reactions }));
    });

    socket.on('message:read', ({ chatId, messageIds, userId }) => {
      dispatch(markMessagesRead({ chatId, messageIds, userId }));
    });

    socket.on('user:online', ({ userId, isOnline, lastSeen }) => {
      dispatch(setOnlineStatus({ userId, isOnline, lastSeen }));
    });

    socket.on('call:incoming', (data) => {
      dispatch(setIncomingCall(data));
    });

    socket.on('call:ended', () => {
      dispatch(fetchChats());
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('reconnect', () => {
      dispatch(fetchChats());
      if (activeChatRef.current?._id) {
        dispatch(fetchMessages({ chatId: activeChatRef.current._id }));
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [user, dispatch]);

  return getSocket();
};

export default useSocket;
