import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Search, ArrowLeft, Users, Send, Image, FileText } from 'lucide-react';
import {
  fetchMyChannels, fetchChannelPosts, createPost, joinChannel,
  searchChannels, setActiveChannel, clearSearch, createChannel,
} from '../../store/slices/channelSlice';
import Avatar from '../ui/Avatar';
import { getMediaUrl, formatMessageTime } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CreateChannelModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const fileRef = React.useRef();

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Kanal nomi kiritilmagan');
    const formData = new FormData();
    formData.append('name', name);
    if (username) formData.append('username', username);
    if (description) formData.append('description', description);
    formData.append('isPublic', isPublic);
    if (avatar) formData.append('avatar', avatar);

    const result = await dispatch(createChannel(formData));
    if (!result.error) {
      toast.success('Kanal yaratildi!');
      onClose();
    } else {
      toast.error(result.payload || 'Xato yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-dark-800 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4">Kanal yaratish</h3>

        <div className="flex justify-center mb-4">
          <button onClick={() => fileRef.current.click()} className="relative w-20 h-20 rounded-full bg-dark-700 flex items-center justify-center hover:bg-dark-600 transition-colors overflow-hidden">
            {avatar ? <img src={URL.createObjectURL(avatar)} className="w-full h-full object-cover" alt="" /> : <Plus size={24} className="text-gray-400" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setAvatar(e.target.files[0])} />
        </div>

        <div className="space-y-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kanal nomi" className="input-field" />
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/g, ''))} placeholder="Username (ixtiyoriy)" className="input-field" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tavsif (ixtiyoriy)" rows={2} className="input-field resize-none" />

          <div className="flex gap-2">
            <button onClick={() => setIsPublic(true)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${isPublic ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-400'}`}>
              Ommaviy
            </button>
            <button onClick={() => setIsPublic(false)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${!isPublic ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-400'}`}>
              Yopiq
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 btn-ghost border border-dark-600 rounded-xl py-2.5">Bekor</button>
          <button onClick={handleCreate} className="flex-1 btn-primary">Yaratish</button>
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, channelId, isAdmin }) => {
  const dispatch = useDispatch();
  const url = post.media?.url ? getMediaUrl(post.media.url) : null;
  const mime = post.media?.mimetype || '';

  return (
    <div className="bg-dark-800 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <Avatar user={post.author} size="sm" />
        <div>
          <p className="text-sm font-medium">{post.author?.firstName}</p>
          <p className="text-xs text-gray-500">{formatMessageTime(post.createdAt)}</p>
        </div>
      </div>

      {url && mime.startsWith('image/') && (
        <img src={url} alt="" className="w-full rounded-xl mb-3 object-cover max-h-80 cursor-pointer" onClick={() => window.open(url, '_blank')} />
      )}
      {url && mime.startsWith('video/') && (
        <video src={url} controls className="w-full rounded-xl mb-3 max-h-80" />
      )}

      {post.content && <p className="text-gray-200 text-sm leading-relaxed">{post.content}</p>}

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dark-700">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          👁 {post.views || 0}
        </span>
        <div className="flex gap-1">
          {(post.reactions || []).map((r) => (
            <span key={r.emoji} className="text-sm">{r.emoji} {r.users?.length}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const CreatePostModal = ({ channelId, onClose }) => {
  const dispatch = useDispatch();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const fileRef = React.useRef();

  const handlePost = async () => {
    const formData = new FormData();
    formData.append('content', content);
    if (media) {
      formData.append('media', media);
      formData.append('type', media.type.startsWith('video') ? 'video' : media.type.startsWith('audio') ? 'voice' : 'image');
    } else {
      formData.append('type', 'text');
    }

    const result = await dispatch(createPost({ channelId, formData }));
    if (!result.error) {
      toast.success('Post joylashtirildi!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-dark-800 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Yangi post</h3>
        {media && (
          <div className="relative mb-3 rounded-xl overflow-hidden">
            {media.type.startsWith('video') ? (
              <video src={URL.createObjectURL(media)} className="w-full max-h-48 object-cover" />
            ) : (
              <img src={URL.createObjectURL(media)} alt="" className="w-full max-h-48 object-cover" />
            )}
            <button onClick={() => setMedia(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
              ✕
            </button>
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Post matni..."
          rows={4}
          className="input-field resize-none mb-3"
        />
        <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => setMedia(e.target.files[0])} />
        <div className="flex gap-2">
          <button onClick={() => fileRef.current.click()} className="btn-ghost border border-dark-600 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Image size={16} /> Media
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="btn-ghost px-4">Bekor</button>
          <button onClick={handlePost} className="btn-primary px-6">Joylashtirish</button>
        </div>
      </div>
    </div>
  );
};

const ChannelPanel = () => {
  const dispatch = useDispatch();
  const { myChannels, activeChannel, posts, searchResults, loading } = useSelector((s) => s.channel);
  const { user } = useSelector((s) => s.auth);
  const [searchQ, setSearchQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showPost, setShowPost] = useState(false);

  useEffect(() => { dispatch(fetchMyChannels()); }, [dispatch]);

  useEffect(() => {
    if (activeChannel) dispatch(fetchChannelPosts({ channelId: activeChannel._id }));
  }, [activeChannel, dispatch]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQ.trim().length >= 2) dispatch(searchChannels(searchQ));
      else dispatch(clearSearch());
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ, dispatch]);

  const isAdmin = activeChannel?.owner?._id === user?._id || activeChannel?.admins?.includes(user?._id);
  const channelPosts = posts[activeChannel?._id] || [];

  if (activeChannel) {
    return (
      <div className="flex flex-col h-full">
        {showPost && <CreatePostModal channelId={activeChannel._id} onClose={() => setShowPost(false)} />}

        <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-700 bg-dark-900">
          <button onClick={() => dispatch(setActiveChannel(null))} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3 flex-1">
            {activeChannel.avatar ? (
              <img src={getMediaUrl(activeChannel.avatar)} className="w-10 h-10 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center text-white font-bold">
                {activeChannel.name[0]}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-100 truncate">{activeChannel.name}</h3>
              <p className="text-xs text-gray-500">{activeChannel.subscriberCount || 0} obunachi</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowPost(true)} className="btn-primary px-3 py-2 text-sm flex items-center gap-1.5">
              <Send size={14} /> Post
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {channelPosts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Postlar yo'q</p>
              {isAdmin && <button onClick={() => setShowPost(true)} className="mt-3 text-primary-400 text-sm">Birinchi post joylash</button>}
            </div>
          )}
          {channelPosts.map((post) => (
            <PostCard key={post._id} post={post} channelId={activeChannel._id} isAdmin={isAdmin} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {showCreate && <CreateChannelModal onClose={() => setShowCreate(false)} />}

      <div className="px-3 py-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Kanal qidirish..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="input-field pl-9 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {searchQ ? (
          <div>
            <p className="text-xs text-gray-500 px-2 mb-2">Qidiruv natijalari</p>
            {searchResults.map((ch) => (
              <div
                key={ch._id}
                onClick={() => dispatch(setActiveChannel(ch))}
                className="sidebar-item hover:bg-dark-700"
              >
                <div className="w-12 h-12 rounded-full bg-primary-700 flex items-center justify-center font-bold text-white flex-shrink-0">
                  {ch.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{ch.name}</p>
                  <p className="text-xs text-gray-500">{ch.subscriberCount} obunachi</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dispatch(joinChannel(ch._id)); toast.success('Obuna bo\'ldingiz!'); }}
                  className="btn-primary px-3 py-1.5 text-xs flex-shrink-0"
                >
                  Obuna
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-500 px-2 mb-2">Mening kanallarim</p>
            {myChannels.map((ch) => (
              <div
                key={ch._id}
                onClick={() => dispatch(setActiveChannel(ch))}
                className="sidebar-item hover:bg-dark-700"
              >
                <div className="w-12 h-12 rounded-full bg-primary-700 flex items-center justify-center font-bold text-white flex-shrink-0">
                  {ch.avatar ? <img src={getMediaUrl(ch.avatar)} className="w-full h-full object-cover rounded-full" alt="" /> : ch.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{ch.name}</p>
                  <p className="text-xs text-gray-500">{ch.subscriberCount} obunachi</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-dark-700">
        <button onClick={() => setShowCreate(true)} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          <Plus size={18} /> Kanal yaratish
        </button>
      </div>
    </div>
  );
};

export default ChannelPanel;
