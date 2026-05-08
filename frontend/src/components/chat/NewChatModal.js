import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Users, X, Check } from 'lucide-react';
import { createPrivateChat, createGroupChat } from '../../store/slices/chatSlice';
import { closeModal } from '../../store/slices/uiSlice';
import Avatar from '../ui/Avatar';
import Modal from '../ui/Modal';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const NewChatModal = () => {
  const dispatch = useDispatch();
  const { modals } = useSelector((s) => s.ui);
  const isOpen = !!modals.newChat;

  const [tab, setTab] = useState('private');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setSearching(true);
        try {
          const res = await api.get('/users/search', { params: { q: query } });
          setResults(res.data.users);
        } catch {
          toast.error('Qidirishda xato yuz berdi');
        }
        setSearching(false);
      } else {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const handleClose = () => {
    dispatch(closeModal('newChat'));
    setQuery('');
    setResults([]);
    setSelected([]);
    setGroupName('');
  };

  const handleSelectUser = async (user) => {
    if (tab === 'private') {
      const result = await dispatch(createPrivateChat(user._id));
      if (!result.error) {
        toast.success('Chat ochildi!');
        handleClose();
      }
    } else {
      setSelected((prev) => {
        const exists = prev.find((u) => u._id === user._id);
        return exists ? prev.filter((u) => u._id !== user._id) : [...prev, user];
      });
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return toast.error('Guruh nomi kiritilmagan');
    if (selected.length === 0) return toast.error('Kamida bitta a\'zo tanlang');

    const result = await dispatch(createGroupChat({
      name: groupName,
      participants: selected.map((u) => u._id),
    }));

    if (!result.error) {
      toast.success('Guruh yaratildi!');
      handleClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Yangi chat" size="md">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('private')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'private' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-400'}`}
        >
          Shaxsiy chat
        </button>
        <button
          onClick={() => setTab('group')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${tab === 'group' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-400'}`}
        >
          <Users size={14} /> Guruh
        </button>
      </div>

      {tab === 'group' && (
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Guruh nomi..."
          className="input-field mb-3"
        />
      )}

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Foydalanuvchi qidirish..."
          className="input-field pl-9"
        />
      </div>

      {selected.length > 0 && tab === 'group' && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((u) => (
            <div key={u._id} className="flex items-center gap-1.5 bg-primary-600/20 border border-primary-600/40 rounded-full px-3 py-1">
              <span className="text-sm text-primary-300">{u.firstName}</span>
              <button onClick={() => setSelected((prev) => prev.filter((x) => x._id !== u._id))}>
                <X size={12} className="text-primary-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {searching && (
          <div className="text-center py-4">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!searching && query.length >= 2 && results.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">Foydalanuvchi topilmadi</p>
        )}
        {results.map((u) => {
          const isSelected = selected.find((s) => s._id === u._id);
          return (
            <div
              key={u._id}
              onClick={() => handleSelectUser(u)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-700 cursor-pointer transition-colors"
            >
              <Avatar user={u} size="sm" showOnline />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-100">{u.firstName} {u.lastName}</p>
                {u.username && <p className="text-xs text-gray-500">@{u.username}</p>}
              </div>
              {tab === 'group' && isSelected && (
                <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tab === 'group' && selected.length > 0 && (
        <button onClick={handleCreateGroup} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
          <Users size={16} /> Guruh yaratish ({selected.length} a'zo)
        </button>
      )}
    </Modal>
  );
};

export default NewChatModal;
