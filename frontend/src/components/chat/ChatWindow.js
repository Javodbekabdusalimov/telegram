import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, Video, Search, MoreVertical, ArrowLeft, Users } from 'lucide-react';
import { fetchMessages, clearUnread } from '../../store/slices/messageSlice';
import { setActiveChat, clearUnread as clearChatUnread } from '../../store/slices/chatSlice';
import { setCallState, openModal } from '../../store/slices/uiSlice';
import Avatar from '../ui/Avatar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { getChatName, getChatUser, formatLastSeen } from '../../utils/helpers';
import { getSocket } from '../../socket';

const ChatWindow = ({ chat }) => {
  const dispatch = useDispatch();
  const { messages, loading, hasMore } = useSelector((s) => s.message);
  const { user } = useSelector((s) => s.auth);
  const { typingUsers } = useSelector((s) => s.chat);
  const socket = getSocket();

  const chatMessages = messages[chat._id] || [];
  const endRef = useRef();
  const containerRef = useRef();

  const chatName = getChatName(chat, user?._id);
  const chatUser = getChatUser(chat, user?._id);
  const typing = typingUsers[chat._id] || {};
  const typingNames = Object.values(typing);
  const isGroup = chat.type === 'group';

  useEffect(() => {
    if (chat._id) {
      dispatch(fetchMessages({ chatId: chat._id }));
      dispatch(clearChatUnread(chat._id));
      socket?.emit('chat:join', chat._id);
    }
  }, [chat._id, dispatch, socket]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages.length]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop < 100 && hasMore[chat._id] && !loading) {
      const oldest = chatMessages[0];
      if (oldest) dispatch(fetchMessages({ chatId: chat._id, before: oldest.createdAt }));
    }
  }, [chat._id, chatMessages, hasMore, loading, dispatch]);

  const startCall = (type) => {
    dispatch(setCallState({ type, chatId: chat._id, targetUser: chatUser, status: 'calling' }));
  };

  const renderDateSeparator = (date, key) => (
    <div key={key} className="flex items-center justify-center my-4">
      <span className="text-gray-400 text-xs bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
        {new Date(date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
      </span>
    </div>
  );

  const renderMessages = () => {
    const items = [];
    let lastDate = null;
    let prevSender = null;
    chatMessages.forEach((msg, i) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== lastDate) {
        items.push(renderDateSeparator(msg.createdAt, `date-${i}`));
        lastDate = msgDate;
        prevSender = null;
      }
      const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
      const showAvatar = !isMe && isGroup && prevSender !== msg.sender?._id;
      prevSender = msg.sender?._id;
      items.push(<MessageBubble key={msg._id} message={msg} isMe={isMe} showAvatar={showAvatar} chatId={chat._id} />);
    });
    return items;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0 shadow-sm">
        <button className="md:hidden btn-ghost p-2" onClick={() => dispatch(setActiveChat(null))}>
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => dispatch(openModal({ modal: 'profile', data: chatUser || chat }))}>
          {chatUser ? <Avatar user={chatUser} size="md" showOnline /> : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              <Users size={20} className="text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{chatName}</h3>
            <p className="text-xs text-gray-400 truncate">
              {typingNames.length > 0 ? `${typingNames[0]} yozmoqda...`
                : isGroup ? `${chat.participants?.length || 0} a'zo`
                : formatLastSeen(chatUser?.lastSeen, chatUser?.isOnline)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!isGroup && (
            <>
              <button onClick={() => startCall('voice')} className="btn-ghost p-2 rounded-xl"><Phone size={18} /></button>
              <button onClick={() => startCall('video')} className="btn-ghost p-2 rounded-xl"><Video size={18} /></button>
            </>
          )}
          <button className="btn-ghost p-2 rounded-xl"><Search size={18} /></button>
          <button className="btn-ghost p-2 rounded-xl"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
        style={{ background: '#f0f2f5' }}>
        {loading && chatMessages.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }} />
          </div>
        )}
        {renderMessages()}
        <div ref={endRef} />
      </div>

      <MessageInput chatId={chat._id} />
    </div>
  );
};

export default ChatWindow;
