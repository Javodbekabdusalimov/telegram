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
    playing ? audioRef.current.pause() : audioRef.current.play();
    setPlaying(!playing);
  };
  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <audio ref={audioRef} src={getMediaUrl(media?.url)}
        onTimeUpdate={(e) => setCurrent(e.target.currentTime)} onEnded={() => setPlaying(false)} />
      <button onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: isMe ? 'rgba(255,255,255,0.25)' : 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
        {playing ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white" />}
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-0.5 mb-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-full"
              style={{ height: `${4 + Math.sin(i * 0.8) * 7 + 3}px`, background: isMe ? 'rgba(255,255,255,0.5)' : '#c4b5fd' }} />
          ))}
        </div>
        <span className="text-xs opacity-70">{formatDuration(media?.duration || current)}</span>
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

  if (message.isDeleted) return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className="text-gray-400 text-sm italic px-3 py-1.5 bg-white rounded-xl shadow-sm">
        Xabar o'chirildi
      </div>
    </div>
  );

  if (message.type === 'system') return (
    <div className="flex justify-center my-2">
      <span className="text-gray-400 text-xs bg-white px-3 py-1 rounded-full shadow-sm">{message.content}</span>
    </div>
  );

  const handleReact = (emoji) => {
    socket?.emit('message:react', { messageId: message._id, emoji, chatId });
    setShowEmojis(false);
  };

  const readStatus = () => {
    if (!isMe) return null;
    const isRead = message.readBy?.some((r) => r.user !== user?._id);
    return isRead
      ? <CheckCheck size={13} style={{ color: isMe ? 'rgba(255,255,255,0.85)' : '#7c3aed' }} />
      : <Check size={13} style={{ color: isMe ? 'rgba(255,255,255,0.6)' : '#9ca3af' }} />;
  };

  const renderMedia = () => {
    if (!message.media && message.type !== 'location') return null;
    if (message.type === 'location') {
      try {
        const loc = JSON.parse(message.content);
        const mapUrl = `https://www.openstreetmap.org/?mlat=${loc.latitude}&mlon=${loc.longitude}#map=15/${loc.latitude}/${loc.longitude}`;
        return (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block mb-1">
            <div className={`flex items-center gap-2 p-3 rounded-xl ${isMe ? 'bg-white/15' : 'bg-purple-50'}`}>
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-sm font-medium">Joylashuv</p>
                <p className="text-xs opacity-70">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</p>
              </div>
            </div>
          </a>
        );
      } catch { return null; }
    }
    const url = getMediaUrl(message.media.url);
    const mime = message.media.mimetype || '';
    const isImage = mime.startsWith('image/') || message.type === 'image';
    const isVideo = mime.startsWith('video/') || message.type === 'video';
    const isAudio = mime.startsWith('audio/') || message.type === 'voice';
    if (isImage) return (
      <img src={url} alt="Media"
        className="rounded-xl max-w-[280px] max-h-[360px] object-cover cursor-pointer hover:opacity-90 transition-opacity mb-1"
        onClick={() => window.open(url, '_blank')} />
    );
    if (isVideo) return (
      <video controls preload="metadata" className="rounded-xl max-w-[280px] max-h-[360px] mb-1 bg-black">
        <source src={url} type={mime || 'video/mp4'} />
      </video>
    );
    if (isAudio) return <VoiceMessage media={message.media} isMe={isMe} />;
    return (
      <a href={url} download={message.media.filename}
        className={`flex items-center gap-3 p-3 rounded-xl mb-1 ${isMe ? 'bg-white/15' : 'bg-purple-50'}`}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
          <Download size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{message.media.filename || 'Fayl'}</p>
          <p className="text-xs opacity-60">{formatFileSize(message.media.size)}</p>
        </div>
      </a>
    );
  };

  const reactionGroups = (message.reactions || []).filter((r) => r.users?.length > 0);
  const timeStr = formatMessageTime(message.createdAt);

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 group`}
      onMouseLeave={() => { setShowMenu(false); setShowEmojis(false); }}>

      {!isMe && showAvatar && <Avatar user={message.sender} size="sm" className="mr-2 mt-auto mb-1" />}
      {!isMe && !showAvatar && <div className="w-9 mr-2" />}

      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[72%] min-w-[80px]`}>
        {!isMe && showAvatar && (
          <span className="text-xs font-semibold mb-1 ml-1" style={{ color: '#7c3aed' }}>
            {message.sender?.firstName}
          </span>
        )}

        {message.replyTo && (
          <div className={`rounded-lg px-3 py-1.5 mb-1 border-l-2 text-sm max-w-full`}
            style={{ borderColor: '#7c3aed', background: isMe ? 'rgba(255,255,255,0.15)' : '#f5f3ff' }}>
            <p className="text-xs font-medium" style={{ color: isMe ? 'rgba(255,255,255,0.85)' : '#7c3aed' }}>
              {message.replyTo.sender?.firstName}
            </p>
            <p className="truncate text-xs opacity-70">{message.replyTo.content || 'Media'}</p>
          </div>
        )}

        <div className="relative">
          <div className={isMe ? 'chat-bubble-me' : 'chat-bubble-other'}>
            {renderMedia()}

            {message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
                {/* invisible spacer so text doesn't collide with the time row */}
                <span style={{ display: 'inline-block', width: message.isEdited ? 80 : 56, height: 1 }} />
              </p>
            )}

            {/* Time row — always pinned to bottom-right inside the bubble */}
            <div className="bubble-meta" style={{ opacity: isMe ? 0.75 : 0.55 }}>
              {message.isEdited && <span style={{ fontSize: 10 }}>tahrirlangan</span>}
              <span>{timeStr}</span>
              {readStatus()}
            </div>
          </div>

          {/* Hover actions */}
          <div className={`absolute top-0 ${isMe ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5`}>
            <button onClick={() => setShowEmojis(!showEmojis)}
              className="p-1.5 rounded-full hover:bg-white text-gray-400 hover:text-gray-700 transition-colors shadow-sm">
              <span className="text-sm">😊</span>
            </button>
            <button onClick={() => dispatch(setReplyTo(message))}
              className="p-1.5 rounded-full hover:bg-white text-gray-400 hover:text-gray-700 transition-colors shadow-sm">
              <Reply size={13} />
            </button>
            {isMe && (
              <button onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full hover:bg-white text-gray-400 hover:text-gray-700 transition-colors shadow-sm">
                <MoreHorizontal size={13} />
              </button>
            )}
          </div>
        </div>

        {showEmojis && (
          <div className={`flex gap-1 bg-white rounded-2xl p-2 shadow-xl border border-gray-100 mt-1 ${isMe ? 'self-end' : 'self-start'}`}>
            {EMOJIS.map((emoji) => (
              <button key={emoji} onClick={() => handleReact(emoji)}
                className="text-xl hover:scale-125 transition-transform">{emoji}</button>
            ))}
          </div>
        )}

        {reactionGroups.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {reactionGroups.map((r) => (
              <button key={r.emoji} onClick={() => handleReact(r.emoji)}
                className="flex items-center gap-1 bg-white hover:bg-purple-50 rounded-full px-2 py-0.5 text-sm border border-gray-200 transition-colors shadow-sm">
                <span>{r.emoji}</span>
                <span className="text-gray-500 text-xs">{r.users.length}</span>
              </button>
            ))}
          </div>
        )}

        {showMenu && isMe && (
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-1 mt-1 w-36 self-end">
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              onClick={() => { dispatch(setEditingMessage(message)); setShowMenu(false); }}>
              <Pencil size={14} style={{ color: '#7c3aed' }} /> Tahrirlash
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2"
              onClick={() => { dispatch(deleteMessage({ chatId, messageId: message._id, forAll: true })); setShowMenu(false); }}>
              <Trash2 size={14} /> O'chirish
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
