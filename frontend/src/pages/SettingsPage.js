import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Camera, Shield, Bell, ChevronRight, LogOut, Info } from 'lucide-react';
import { logout, updateProfile } from '../store/slices/authSlice';
import { setActivePanel } from '../store/slices/uiSlice';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';
import i18n from '../i18n';

const LANGS = [
  { code: 'uz', label: "O'zbek",  flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName]   = useState(user?.lastName  || '');
  const [bio, setBio]             = useState(user?.bio       || '');
  const [username, setUsername]   = useState(user?.username  || '');
  const [lang, setLang]           = useState(i18n.language);
  const avatarRef = useRef();

  const handleSave = async () => {
    const formData = new FormData();
    if (firstName) formData.append('firstName', firstName);
    if (lastName  !== undefined) formData.append('lastName', lastName);
    if (bio       !== undefined) formData.append('bio', bio);
    if (username) formData.append('username', username);
    const result = await dispatch(updateProfile(formData));
    if (!result.error) { toast.success('Profil yangilandi!'); setEditing(false); }
    else toast.error(result.payload || 'Xato');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    await dispatch(updateProfile(formData));
    toast.success('Rasm yangilandi!');
  };

  const changeLang = (code) => {
    i18n.changeLanguage(code); localStorage.setItem('javogram_lang', code);
    setLang(code); toast.success("Til o'zgartirildi");
  };

  const Row = ({ icon: Icon, label, value, onClick, danger }) => (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-purple-50 transition-colors rounded-xl"
      style={{ color: danger ? '#ef4444' : '#374151' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: danger ? '#fee2e2' : '#f5f3ff' }}>
        <Icon size={18} style={{ color: danger ? '#ef4444' : '#7c3aed' }} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium">{label}</p>
        {value && <p className="text-xs text-gray-400 mt-0.5">{value}</p>}
      </div>
      {!danger && <ChevronRight size={16} className="text-gray-300" />}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={() => dispatch(setActivePanel('chats'))} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-800">Sozlamalar</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile card */}
        <div className="px-4 py-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg,#faf9ff,#f5f3ff)' }}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar user={user} size="lg" />
              <button onClick={() => avatarRef.current.click()}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera size={18} className="text-white" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ism" className="input-field text-sm py-2" />
                  <input value={lastName}  onChange={(e) => setLastName(e.target.value)}  placeholder="Familiya" className="input-field text-sm py-2" />
                  <input value={username}  onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/g,''))} placeholder="@username" className="input-field text-sm py-2" />
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio..." rows={2} className="input-field text-sm py-2 resize-none" maxLength={256} />
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Bekor</button>
                    <button onClick={handleSave} className="flex-1 btn-primary text-sm">Saqlash</button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-gray-800 text-lg">{user?.firstName} {user?.lastName}</h3>
                  {user?.username && <p className="text-sm" style={{ color: '#7c3aed' }}>@{user.username}</p>}
                  {user?.bio && <p className="text-gray-500 text-sm mt-1">{user.bio}</p>}
                  <p className="text-gray-400 text-xs mt-1">{user?.phone}</p>
                  <button onClick={() => setEditing(true)} className="text-sm mt-2 hover:underline" style={{ color: '#7c3aed' }}>
                    Profilni tahrirlash →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-2 py-2">
          <div className="mb-2">
            <p className="text-xs text-gray-400 px-4 mb-1 uppercase tracking-wider font-semibold">Asosiy</p>
            <Row icon={Bell}   label="Bildirishnomalar" value="Yoqilgan" onClick={() => {}} />
            <Row icon={Shield} label="Maxfiylik"        onClick={() => {}} />
          </div>

          <div className="mb-2">
            <p className="text-xs text-gray-400 px-4 mb-1 uppercase tracking-wider font-semibold">Til</p>
            <div className="px-4 py-2 space-y-1">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => changeLang(l.code)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                  style={lang === l.code ? { background: '#f5f3ff', color: '#7c3aed' } : { color: '#374151' }}>
                  <span className="text-xl">{l.flag}</span>
                  <span className="font-medium text-sm">{l.label}</span>
                  {lang === l.code && <span className="ml-auto text-xs" style={{ color: '#7c3aed' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <p className="text-xs text-gray-400 px-4 mb-1 uppercase tracking-wider font-semibold">Haqida</p>
            <Row icon={Info} label="JAVOGRAM haqida" value="v1.0.0 · Barcha huquqlar himoyalangan" onClick={() => {}} />
          </div>

          <div className="px-2 mt-4">
            <button onClick={async () => { if (window.confirm('Chiqishni xohlaysizmi?')) await dispatch(logout()); }}
              className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-red-50 transition-colors rounded-xl text-red-500">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <LogOut size={18} className="text-red-500" />
              </div>
              <span className="font-semibold">Chiqish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
