import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, X, ChevronRight, ChevronLeft, Eye } from 'lucide-react';
import { fetchStories, viewStory, deleteStory, createStory } from '../../store/slices/storySlice';
import { setViewingStory, nextStory, closeStory } from '../../store/slices/storySlice';
import Avatar from '../ui/Avatar';
import { getMediaUrl } from '../../utils/helpers';

const StoryViewer = () => {
  const dispatch = useDispatch();
  const { viewing, viewingIndex } = useSelector((s) => s.story);
  const { user } = useSelector((s) => s.auth);
  const [progress, setProgress] = useState(0);

  const story = viewing?.stories[viewingIndex];

  useEffect(() => {
    if (!story) return;
    dispatch(viewStory(story._id));
    setProgress(0);
    const duration = (story.duration || 5) * 1000;
    const interval = 50;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          dispatch(nextStory());
          return 0;
        }
        return p + step;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [story, dispatch]);

  if (!viewing || !story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative w-full max-w-sm h-full max-h-[700px] rounded-2xl overflow-hidden"
        style={{ backgroundColor: story.backgroundColor || '#1a1a2e' }}>
        <div className="absolute top-0 left-0 right-0 p-3 z-10">
          <div className="flex gap-1 mb-3">
            {viewing.stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{ width: i < viewingIndex ? '100%' : i === viewingIndex ? `${progress}%` : '0%' }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar user={viewing.user} size="sm" />
              <div>
                <p className="text-white font-medium text-sm">{viewing.user.firstName}</p>
                <p className="text-white/60 text-xs">{new Date(story.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
            <button onClick={() => dispatch(closeStory())} className="text-white/80 hover:text-white">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          {story.media ? (
            story.type === 'video' ? (
              <video src={getMediaUrl(story.media)} className="w-full h-full object-cover" autoPlay muted loop />
            ) : (
              <img src={getMediaUrl(story.media)} alt="Story" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-white text-2xl font-medium text-center leading-relaxed"
                style={{ color: story.textColor || '#fff' }}>
                {story.content}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => dispatch(nextStory())}
          className="absolute right-0 inset-y-0 w-1/2 z-20"
        />
        <button
          onClick={() => {
            if (viewingIndex > 0) {
              dispatch(setViewingStory({ group: viewing, index: viewingIndex - 1 }));
            }
          }}
          className="absolute left-0 inset-y-0 w-1/2 z-20"
        />

        {story.viewers && user?._id === viewing.user._id && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full">
              <Eye size={14} className="text-white/70" />
              <span className="text-white/70 text-sm">{story.viewers.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AddStoryModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const [type, setType] = useState('image');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [bg, setBg] = useState('#1a1a2e');
  const fileRef = React.useRef();

  const colors = ['#1a1a2e', '#e74c3c', '#9b59b6', '#2980b9', '#27ae60', '#f39c12', '#1abc9c'];

  const handleCreate = async () => {
    const formData = new FormData();
    formData.append('type', file ? (file.type.startsWith('video') ? 'video' : 'image') : 'text');
    if (file) formData.append('media', file);
    if (text) formData.append('content', text);
    formData.append('backgroundColor', bg);
    formData.append('duration', '5');

    await dispatch(createStory(formData));
    await dispatch(fetchStories());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-dark-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Hikoya yaratish</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>

        <div className="aspect-[9/16] rounded-xl mb-4 relative overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: bg }}>
          {file && (
            file.type.startsWith('video') ? (
              <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
            ) : (
              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
            )
          )}
          {text && !file && (
            <p className="text-white text-xl font-medium text-center px-4">{text}</p>
          )}
        </div>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Matn qo'shish..."
          className="input-field mb-3"
        />

        <div className="flex gap-2 mb-3">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setBg(c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${bg === c ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setFile(e.target.files[0])} />

        <div className="flex gap-2">
          <button onClick={() => fileRef.current.click()} className="flex-1 btn-ghost border border-dark-600 rounded-xl py-2.5 text-sm">
            Media qo'shish
          </button>
          <button onClick={handleCreate} className="flex-1 btn-primary rounded-xl py-2.5 text-sm">
            Joylashtirish
          </button>
        </div>
      </div>
    </div>
  );
};

const Stories = () => {
  const dispatch = useDispatch();
  const { grouped, viewing } = useSelector((s) => s.story);
  const { user } = useSelector((s) => s.auth);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    dispatch(fetchStories());
  }, [dispatch]);

  return (
    <>
      {viewing && <StoryViewer />}
      {showAdd && <AddStoryModal onClose={() => setShowAdd(false)} />}

      <div className="flex gap-3 px-3 py-3 overflow-x-auto no-scrollbar">
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowAdd(true)}
            className="w-14 h-14 rounded-full bg-dark-700 border-2 border-dashed border-primary-500 flex items-center justify-center hover:bg-dark-600 transition-colors"
          >
            <Plus size={20} className="text-primary-400" />
          </button>
          <span className="text-xs text-gray-500 w-14 text-center truncate">Qo'shish</span>
        </div>

        {grouped.map((group, gi) => (
          <div
            key={gi}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
            onClick={() => dispatch(setViewingStory({ group, index: 0 }))}
          >
            <div className={`p-0.5 rounded-full ${group.hasUnread ? 'bg-gradient-to-tr from-primary-500 to-purple-500' : 'bg-dark-600'}`}>
              <Avatar user={group.user} size="md" className="border-2 border-dark-900" />
            </div>
            <span className="text-xs text-gray-400 w-14 text-center truncate">{group.user.firstName}</span>
          </div>
        ))}
      </div>
    </>
  );
};

export default Stories;
