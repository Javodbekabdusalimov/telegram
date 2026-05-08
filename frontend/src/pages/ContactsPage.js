import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, UserPlus, Users, ArrowLeft } from 'lucide-react';
import { createPrivateChat } from '../store/slices/chatSlice';
import { setActivePanel } from '../store/slices/uiSlice';
import Avatar from '../components/ui/Avatar';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ContactsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [contacts, setContacts] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [globalResults, setGlobalResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState('contacts');

  useEffect(() => { api.get('/users/contacts').then((r) => setContacts(r.data.contacts || [])).catch(() => {}); }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchQ.trim().length >= 2 && tab === 'global') {
        setSearching(true);
        try { const res = await api.get('/users/search', { params: { q: searchQ } }); setGlobalResults(res.data.users || []); }
        catch { toast.error('Qidirishda xato'); }
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ, tab]);

  const handleAddContact = async (userId) => {
    try { const res = await api.post('/users/contacts', { userId }); setContacts((p) => [...p, res.data.contact]); toast.success("Kontakt qo'shildi!"); }
    catch { toast.error('Xato yuz berdi'); }
  };

  const handleOpenChat = async (userId) => {
    const result = await dispatch(createPrivateChat(userId));
    if (!result.error) { dispatch(setActivePanel('chats')); toast.success('Chat ochildi!'); }
  };

  const filteredContacts = contacts.filter((c) =>
    `${c.user?.firstName} ${c.user?.lastName}`.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={() => dispatch(setActivePanel('chats'))} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-800">Kontaktlar</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-3 pt-3">
        <button onClick={() => setTab('contacts')}
          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={tab === 'contacts' ? { background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff' } : { background: '#f5f3ff', color: '#6b7280' }}>
          Kontaktlar
        </button>
        <button onClick={() => setTab('global')}
          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
          style={tab === 'global' ? { background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff' } : { background: '#f5f3ff', color: '#6b7280' }}>
          <Search size={14} /> Global
        </button>
      </div>

      <div className="px-3 py-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder={tab === 'global' ? 'Ism yoki username...' : 'Kontakt qidirish...'}
            value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="input-field pl-9 py-2.5 text-sm" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {tab === 'contacts' && (
          <>
            {filteredContacts.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Users size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Kontaktlar yo'q</p>
                <button onClick={() => setTab('global')} className="mt-2 text-sm hover:underline" style={{ color: '#7c3aed' }}>
                  Global qidiruvdan foydalaning
                </button>
              </div>
            )}
            {filteredContacts.map((c) => (
              <div key={c._id} className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-purple-50 cursor-pointer transition-colors"
                onClick={() => handleOpenChat(c.user._id)}>
                <Avatar user={c.user} size="md" showOnline />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{c.nickname || `${c.user?.firstName} ${c.user?.lastName || ''}`}</p>
                  {c.user?.username && <p className="text-xs text-gray-400">@{c.user.username}</p>}
                </div>
                {c.user?.isOnline && <span className="text-xs text-green-500 font-medium">Online</span>}
              </div>
            ))}
          </>
        )}

        {tab === 'global' && (
          <>
            {searching && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }} />
              </div>
            )}
            {!searching && searchQ.length >= 2 && globalResults.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Hech narsa topilmadi</div>
            )}
            {globalResults.map((u) => {
              const isContact = contacts.find((c) => c.user?._id === u._id);
              return (
                <div key={u._id} className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-purple-50 transition-colors">
                  <Avatar user={u} size="md" showOnline />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenChat(u._id)}>
                    <p className="font-semibold text-gray-800 truncate">{u.firstName} {u.lastName || ''}</p>
                    {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
                  </div>
                  <div className="flex gap-1.5">
                    {!isContact && (
                      <button onClick={() => handleAddContact(u._id)} className="btn-ghost p-2 rounded-xl" title="Kontakt qo'shish">
                        <UserPlus size={16} />
                      </button>
                    )}
                    <button onClick={() => handleOpenChat(u._id)}
                      className="btn-primary px-3 py-1.5 text-xs">Yozish</button>
                  </div>
                </div>
              );
            })}
            {searchQ.length < 2 && (
              <div className="text-center py-12 text-gray-400">
                <Search size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Username yoki ism bilan qidiring</p>
                <p className="text-xs mt-1 text-gray-300">Kamida 2 ta harf kiriting</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContactsPage;
