import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Check, CheckCheck, Pencil, Trash2, Reply, MoreHorizontal, Download, Play, Pause } from 'lucide-react';
import { formatMessageTime, formatFileSize, formatDuration, getMediaUrl } from '../../utils/helpers';
import { setReplyTo, setEditingMessage, deleteMessage } from '../../store/slices/messageSlice';
import { getSocket } from '../../socket';
import Avatar from '../ui/Avatar';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const VoiceMessage = ({ media, isMe }) => {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const audioRef = React.useRef(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <audio
        ref={audioRef}
        src={getMediaUrl(media?.url)}
        onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-primary-600 hover:bg-primary-700'}`}
      >
        {playing ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white" />}
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-1 mb-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all ${isMe ? 'bg-white/40' : 'bg-dark-400'}`}
              style={{ height: `${4 + Math.sin(i * 0.8) * 8 + 4}px` }}
            />
          ))}
        </div>
        <span className={`text-xs ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
          {formatDuration(media?.duration || current)}
        </span>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isMe, showAvatar, chatId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const socket = getSocket();

  if (message.isDeleted) {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
        <div className="text-gray-600 text-sm italic px-3 py-1.5 bg-dark-800/50 rounded-xl">
          Xabar o'chirildi
        </div>
      </div>
    );
  }

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-gray-500 text-xs bg-dark-800 px-3 py-1 rounded-full">{message.content}</span>
      </div>
    );
  }

  const handleReact = (emoji) => {
    socket?.emit('message:react', { messageId: message._id, emoji, chatId });
    setShowEmojis(false);
  };

  const readStatus = () => {
    if (!isMe) return null;
    const isRead = message.readBy?.some((r) => r.user !== user?._id);
    return isRead
      ? <CheckCheck size={14} className="text-primary-400" />
      : <Check size={14} className="text-white/60" />;
  };

  const renderMedia = () => {
    if (!message.media && message.type !== 'location') return null;

    if (message.type === 'location') {
      try {
        const loc = JSON.parse(message.content);
        const mapUrl = `https://www.openstreetmap.org/?mlat=${loc.latitude}&mlon=${loc.longitude}#map=15/${loc.latitude}/${loc.longitude}`;
        return (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block mb-1">
            <div className={`flex items-center gap-2 p-3 rounded-xl ${isMe ? 'bg-white/10' : 'bg-dark-600'}`}>
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-sm font-medium">Joylashuv</p>
                <p className="text-xs text-gray-400">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</p>
              </div>
            </div>
          </a>
        );
      } catch {
        return null;
      }
    }

    const url = getMediaUrl(message.media.url);
    const mime = message.media.mimetype || '';
    const isImage = mime.startsWith('image/') || message.type === 'image';
    const isVideo = mime.startsWith('video/') || message.type === 'video';
    const isAudio = mime.startsWith('audio/') || message.type === 'voice';

    if (isImage) {
      return (
        <img
          src={url}
          alt="Media"
          className="rounded-xl max-w-[280px] max-h-[360px] object-cover cursor-pointer hover:opacity-90 transition-opacity mb-1"
          onClick={() => window.open(url, '_blank')}
        />
      );
    }

    if (isVideo) {
      return (
        <video
          controls
          preload="metadata"
          className="rounded-xl max-w-[280px] max-h-[360px] mb-1 bg-black"
        >
          <source src={url} type={mime || 'video/mp4'} />
        </video>
      );
    }

    if (isAudio) {
      return <VoiceMessage media={message.media} isMe={isMe} />;
    }

    return (
      <a
        href={url}
        download={message.media.filename}
        className={`flex items-center gap-3 p-3 rounded-xl mb-1 ${isMe ? 'bg-white/10' : 'bg-dark-600'}`}
      >
        <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Download size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{message.media.filename || 'Fayl'}</p>
          <p className="text-xs text-gray-400">{formatFileSize(message.media.size)}</p>
        </div>
      </a>
    );
  };

  const reactionGroups = (message.reactions || []).filter((r) => r.users?.length > 0);

  return (
    <div
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 group`}
      onMouseLeave={() => { setShowMenu(false); setShowEmojis(false); }}
    >
      {!isMe && showAvatar && (
        <Avatar user={message.sender} size="sm" className="mr-2 mt-auto mb-1" />
      )}
      {!isMe && !showAvatar && <div className="w-9 mr-2" />}

      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%] min-w-[80px]`}>
        {!isMe && showAvatar && (
          <span className="text-xs text-primary-400 font-medium mb-1 ml-1">
            {message.sender?.firstName}
          </span>
        )}

        {message.replyTo && (
          <div className={`rounded-lg px-3 py-1.5 mb-1 border-l-2 border-primary-400 text-sm ${isMe ? 'bg-primary-700/50' : 'bg-dark-600'} max-w-full`}>
            <p className="text-primary-300 text-xs font-medium">{message.replyTo.sender?.firstName}</p>
            <p className="text-gray-300 truncate text-xs">{message.replyTo.content || 'Media'}</p>
          </div>
        )}

        <div className="relative">
          <div className={isMe ? 'chat-bubble-me' : 'chat-bubble-other'}>
            {renderMedia()}
            {message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words min-w-[60px]">{message.content}</p>
            )}
            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-end'}`}>
              {message.isEdited && <span className="text-xs opacity-60">tahrirlangan</span>}
              <span className="text-xs opacity-60">{formatMessageTime(message.createdAt)}</span>
              {readStatus()}
            </div>
          </div>

          <div className={`absolute top-0 ${isMe ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-1`}>
            <button
              onClick={() => setShowEmojis(!showEmojis)}
              className="p-1.5 rounded-full hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <span className="text-base">😊</span>
            </button>
            <button
              onClick={() => dispatch(setReplyTo(message))}
              className="p-1.5 rounded-full hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Reply size={14} />
            </button>
            {isMe && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>
            )}
          </div>
        </div>

        {showEmojis && (
          <div className={`flex gap-1 bg-dark-700 rounded-2xl p-2 shadow-xl border border-dark-600 mt-1 ${isMe ? 'self-end' : 'self-start'}`}>
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="text-xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {reactionGroups.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {reactionGroups.map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleReact(r.emoji)}
                className="flex items-center gap-1 bg-dark-700 hover:bg-dark-600 rounded-full px-2 py-0.5 text-sm border border-dark-600 transition-colors"
              >
                <span>{r.emoji}</span>
                <span className="text-gray-400 text-xs">{r.users.length}</span>
              </button>
            ))}
          </div>
        )}

        {showMenu && isMe && (
          <div className="bg-dark-700 rounded-xl shadow-2xl border border-dark-600 py-1 mt-1 w-36 self-end">
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-dark-600 flex items-center gap-2"
              onClick={() => { dispatch(setEditingMessage(message)); setShowMenu(false); }}
            >
              <Pencil size={14} /> Tahrirlash
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-600 flex items-center gap-2"
              onClick={() => { dispatch(deleteMessage({ chatId, messageId: message._id, forAll: true })); setShowMenu(false); }}
            >
              <Trash2 size={14} /> O'chirish
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
