import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initSocket, disconnectSocket, getSocket } from '../socket';
import { receiveMessage, updateMessageReactions, markMessagesRead } from '../store/slices/messageSlice';
import { setTyping, setOnlineStatus, updateLastMessage, incrementUnread } from '../store/slices/chatSlice';
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

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      disconnectSocket();
    };
  }, [user, dispatch]);

  return getSocket();
};

export default useSocket;
