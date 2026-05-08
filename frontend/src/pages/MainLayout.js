import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageCircle, Tv2, Settings, Contact } from 'lucide-react';
import { setActivePanel } from '../store/slices/uiSlice';
import { fetchChats } from '../store/slices/chatSlice';
import useSocket from '../hooks/useSocket';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import ChannelPanel from '../components/channel/ChannelPanel';
import ContactsPage from './ContactsPage';
import SettingsPage from './SettingsPage';
import Stories from '../components/stories/Stories';
import NewChatModal from '../components/chat/NewChatModal';
import CallModal from '../components/ui/CallModal';
import Avatar from '../components/ui/Avatar';
import { Toaster } from 'react-hot-toast';

const NAV_ITEMS = [
  { id: 'chats',    icon: MessageCircle, label: 'Chatlar' },
  { id: 'contacts', icon: Contact,       label: 'Kontaktlar' },
  { id: 'channels', icon: Tv2,           label: 'Kanallar' },
  { id: 'settings', icon: Settings,      label: 'Sozlamalar' },
];

const MainLayout = () => {
  const dispatch = useDispatch();
  const { activePanel } = useSelector((s) => s.ui);
  const { activeChat } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);

  useSocket();
  useEffect(() => { dispatch(fetchChats()); }, [dispatch]);

  const renderSidebarContent = () => {
    switch (activePanel) {
      case 'channels': return <ChannelPanel />;
      case 'contacts': return <ContactsPage />;
      case 'settings': return <SettingsPage />;
      default: return (
        <div className="flex flex-col h-full">
          <Stories />
          <div className="flex-1 overflow-hidden"><ChatList /></div>
        </div>
      );
    }
  };

  const showChatOnMobile = !!activeChat && activePanel === 'chats';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f2f5' }}>
      <Toaster position="top-center" toastOptions={{
        style: { background: '#fff', color: '#111827', border: '1px solid #ede9fe', boxShadow: '0 4px 16px rgba(124,58,237,0.12)' },
        duration: 3000,
      }} />

      <CallModal />
      <NewChatModal />

      {/* ── Left nav strip ── */}
      <div className="flex flex-col flex-shrink-0 bg-white border-r border-gray-100 shadow-sm" style={{ width: 64 }}>
        {/* Logo */}
        <div className="p-2 mb-1 mt-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto shadow-md"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.97c-.12.57-.46.71-.93.44l-2.58-1.9-1.24 1.2c-.14.14-.26.26-.52.26l.18-2.6 4.74-4.28c.21-.18-.04-.28-.32-.1L7.46 14.5l-2.54-.8c-.55-.17-.56-.55.12-.82l9.91-3.82c.46-.17.86.11.69.74z" fill="white"/>
            </svg>
          </div>
        </div>

        {/* Nav icons */}
        <div className="flex-1 flex flex-col items-center gap-1 px-2">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => dispatch(setActivePanel(id))} title={label}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150"
              style={activePanel === id
                ? { background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }
                : { color: '#9ca3af', background: 'transparent' }}>
              <Icon size={20} />
            </button>
          ))}
        </div>

        {/* Avatar */}
        <div className="p-2 mb-2">
          <button onClick={() => dispatch(setActivePanel('settings'))} className="block mx-auto">
            <Avatar user={user} size="sm" showOnline className="hover:ring-2 hover:ring-purple-400 transition-all" />
          </button>
        </div>
      </div>

      {/* ── Chat list sidebar ── */}
      <div className={`flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden ${showChatOnMobile ? 'hidden md:flex' : 'flex'}`}
        style={{ width: 320 }}>
        {renderSidebarContent()}
      </div>

      {/* ── Main area ── */}
      <div className={`flex-1 flex flex-col overflow-hidden ${!showChatOnMobile && !activeChat ? 'hidden md:flex' : 'flex'}`}
        style={{ background: '#f0f2f5' }}>
        {activeChat && activePanel === 'chats' ? (
          <ChatWindow chat={activeChat} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-28 h-28 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.97c-.12.57-.46.71-.93.44l-2.58-1.9-1.24 1.2c-.14.14-.26.26-.52.26l.18-2.6 4.74-4.28c.21-.18-.04-.28-.32-.1L7.46 14.5l-2.54-.8c-.55-.17-.56-.55.12-.82l9.91-3.82c.46-.17.86.11.69.74z"
                  fill="#7c3aed"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#7c3aed' }}>JAVOGRAM</h2>
            <p className="text-gray-400 max-w-xs leading-relaxed text-sm">
              Xabar yuborish uchun chapdan chat tanlang yoki yangi chat boshlang
            </p>
            <div className="mt-6 flex gap-3 flex-wrap justify-center">
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-xs text-gray-500">End-to-end shifrlangan</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
                <div className="w-2 h-2 rounded-full" style={{ background: '#7c3aed' }} />
                <span className="text-xs text-gray-500">Real-time xabar</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainLayout;
