import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { uz } from 'date-fns/locale';

export const formatMessageTime = (date) => {
  const d = new Date(date);
  return format(d, 'HH:mm');
};

export const formatChatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Kecha';
  if (isThisWeek(d)) return format(d, 'EEEE', { locale: uz });
  return format(d, 'dd.MM.yyyy');
};

export const formatLastSeen = (date, isOnline) => {
  if (isOnline) return 'Onlayn';
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return `bugun ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `kecha ${format(d, 'HH:mm')}`;
  return formatDistanceToNow(d, { addSuffix: true, locale: uz });
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const getAvatarFallback = (user) => {
  if (!user) return '?';
  const first = user.firstName?.[0] || '';
  const last = user.lastName?.[0] || '';
  return (first + last).toUpperCase() || '?';
};

export const getAvatarColor = (id) => {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
    'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500',
    'bg-pink-500', 'bg-rose-500',
  ];
  if (!id) return colors[0];
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[sum % colors.length];
};

export const getChatName = (chat, myId) => {
  if (chat.type === 'group') return chat.name;
  const other = chat.participants?.find((p) => p.user?._id !== myId);
  return other?.user ? `${other.user.firstName} ${other.user.lastName || ''}`.trim() : 'Unknown';
};

export const getChatAvatar = (chat, myId) => {
  if (chat.type === 'group') return chat.avatar;
  const other = chat.participants?.find((p) => p.user?._id !== myId);
  return other?.user?.avatar || '';
};

export const getChatUser = (chat, myId) => {
  if (chat.type === 'group') return null;
  const other = chat.participants?.find((p) => p.user?._id !== myId);
  return other?.user || null;
};

export const truncate = (str, len = 40) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
};

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${path}`;
};
