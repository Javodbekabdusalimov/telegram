import React from 'react';
import { getAvatarFallback, getAvatarColor, getMediaUrl } from '../../utils/helpers';

const Avatar = ({ user, size = 'md', className = '', showOnline = false }) => {
  const sizeMap = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };
  const onlineSize = { xs: 'w-2 h-2', sm: 'w-2.5 h-2.5', md: 'w-3 h-3', lg: 'w-4 h-4', xl: 'w-5 h-5' };

  const avatarUrl = user?.avatar ? getMediaUrl(user.avatar) : null;
  const fallback = getAvatarFallback(user);
  const bgColor = getAvatarColor(user?._id);

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={fallback}
          className={`${sizeMap[size]} rounded-full object-cover`}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div
        className={`${sizeMap[size]} rounded-full ${bgColor} flex items-center justify-center font-semibold text-white ${avatarUrl ? 'hidden' : 'flex'}`}
      >
        {fallback}
      </div>
      {showOnline && user?.isOnline && (
        <span
          className={`absolute bottom-0 right-0 ${onlineSize[size]} bg-green-400 rounded-full border-2 border-white`}
        />
      )}
    </div>
  );
};

export default Avatar;
