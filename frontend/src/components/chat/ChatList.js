import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Archive, MoreVertical } from 'lucide-react';
import { setActiveChat, setSearchQuery, archiveChat } from '../../store/slices/chatSlice';
import { fetchMessages, clearChatMessages } from '../../store/slices/messageSlice';
import { openModal } from '../../store/slices/uiSlice';
import Avatar from '../ui/Avatar';
import { formatChatTime, getChatName, getChatAvatar, getChatUser, truncate } from '../../utils/helpers';

const ChatItem = ({ chat, isActive, onClick, myId }) => {
  const dispatch = useDispatch();
  const [showMenu, setShowMenu] = useState(false);
  const name = getChatName(chat, myId);
  const avatarUser = chat.type === 'private' ? getChatUser(chat, myId) : null;
  const avatarPath = getChatAvatar(chat, myId);
  const lastMsg = chat.lastMessage;
  const isOnline = avatarUser?.isOnline;
  const unread = chat.unreadCount || 0;
  const isMuted = false;

  const getLastMessagePreview = () => {
    if (!lastMsg) return '';
    if (lastMsg.isDeleted) return 'Xabar o\'chirildi';
    switch (lastMsg.type) {
      case 'image': return '📷 Rasm';
      case 'video': return '🎥 Video';
      case 'voice': return '🎤 Ovozli xabar';
      case 'file': return `📎 ${lastMsg.media?.filename || 'Fayl'}`;
      case 'location': return '📍 Joylashuv';
      case 'system': return lastMsg.content;
      default: return truncate(lastMsg.content, 35);
    }
  };

  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
      className={`sidebar-item relative ${isActive ? 'bg-primary-600/20 hover:bg-primary-600/25' : 'hover:bg-dark-700'}`}
    >
      <div className="relative flex-shrink-0">
        {avatarUser ? (
          <Avatar user={avatarUser} size="md" showOnline />
        ) : (
          <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center text-gray-300 font-semibold text-base flex-shrink-0">
            {name?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`font-medium truncate ${isActive ? 'text-white' : 'text-gray-100'}`}>
            {name}
          </span>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {isMuted && <span className="text-gray-500 text-xs">🔇</span>}
            <span className="text-gray-500 text-xs">{formatChatTime(chat.updatedAt)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-gray-500 text-sm truncate">
            {lastMsg?.sender?._id === myId && <span className="text-primary-400">Siz: </span>}
            {getLastMessagePreview()}
          </p>
          {unread > 0 && (
            <span className="bg-primary-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ml-1 flex-shrink-0">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>

      {showMenu && (
        <div className="absolute right-2 top-12 bg-dark-700 rounded-xl shadow-2xl z-50 py-1 w-40 border border-dark-600">
          <button
            className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-dark-600 flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              dispatch(archiveChat({ chatId: chat._id, archive: !chat.isArchived }));
              setShowMenu(false);
            }}
          >
            <Archive size={14} />
            {chat.isArchived ? 'Arxivdan chiqarish' : 'Arxivlash'}
          </button>
        </div>
      )}
    </div>
  );
};

const ChatList = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { chats, activeChat, searchQuery } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => {
    let list = chats.filter((c) => (showArchived ? c.isArchived : !c.isArchived));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => {
        const name = getChatName(c, user?._id).toLowerCase();
        return name.includes(q);
      });
    }
    return list;
  }, [chats, searchQuery, showArchived, user]);

  const archivedCount = chats.filter((c) => c.isArchived).length;

  const handleSelect = (chat) => {
    dispatch(setActiveChat(chat));
    dispatch(clearChatMessages(chat._id));
    dispatch(fetchMessages({ chatId: chat._id }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={t('chat.search')}
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="input-field pl-9 py-2.5 text-sm rounded-xl"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {archivedCount > 0 && !searchQuery && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full sidebar-item text-gray-400 hover:text-gray-200 hover:bg-dark-700 mb-1"
          >
            <Archive size={18} className="text-primary-400" />
            <span className="text-sm font-medium">
              {t('chat.archived')} <span className="text-primary-400 ml-1">{archivedCount}</span>
            </span>
          </button>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            {searchQuery ? t('common.no_results') : t('chat.no_chats')}
          </div>
        )}

        {filtered.map((chat) => (
          <ChatItem
            key={chat._id}
            chat={chat}
            isActive={activeChat?._id === chat._id}
            onClick={() => handleSelect(chat)}
            myId={user?._id}
          />
        ))}
      </div>

      <div className="p-3 border-t border-dark-700">
        <button
          onClick={() => dispatch(openModal({ modal: 'newChat' }))}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={18} />
          {t('chat.new_chat')}
        </button>
      </div>
    </div>
  );
};

export default ChatList;
