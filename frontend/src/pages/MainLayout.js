import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MessageCircle, Tv2, Settings, Contact,
} from 'lucide-react';
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
  { id: 'chats', icon: MessageCircle, label: 'Chatlar' },
  { id: 'contacts', icon: Contact, label: 'Kontaktlar' },
  { id: 'channels', icon: Tv2, label: 'Kanallar' },
  { id: 'settings', icon: Settings, label: 'Sozlamalar' },
];

const MainLayout = () => {
  const dispatch = useDispatch();
  const { activePanel } = useSelector((s) => s.ui);
  const { activeChat } = useSelector((s) => s.chat);
  const { user } = useSelector((s) => s.auth);

  useSocket();

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  const renderSidebarContent = () => {
    switch (activePanel) {
      case 'channels': return <ChannelPanel />;
      case 'contacts': return <ContactsPage />;
      case 'settings': return <SettingsPage />;
      default: return (
        <div className="flex flex-col h-full">
          <Stories />
          <div className="flex-1 overflow-hidden">
            <ChatList />
          </div>
        </div>
      );
    }
  };

  const showChatOnMobile = !!activeChat && activePanel === 'chats';

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1f3a50', color: '#e8eaed', border: '1px solid #2f4a5f' },
          duration: 3000,
        }}
      />

      <CallModal />
      <NewChatModal />

      <div className="flex flex-col flex-shrink-0 bg-dark-950 border-r border-dark-700" style={{ width: '64px' }}>
        <div className="p-2 mb-2">
          <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary-600/30">
            <MessageCircle size={20} className="text-white" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1 px-2">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => dispatch(setActivePanel(id))}
              title={label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                activePanel === id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-dark-700'
              }`}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>

        <div className="p-2 mb-2">
          <button
            onClick={() => dispatch(setActivePanel('settings'))}
            className="block mx-auto"
          >
            <Avatar user={user} size="sm" showOnline className="hover:ring-2 hover:ring-primary-500 transition-all" />
          </button>
        </div>
      </div>

      <div className={`flex-shrink-0 border-r border-dark-700 bg-dark-900 flex flex-col overflow-hidden ${showChatOnMobile ? 'hidden md:flex' : 'flex'}`}
        style={{ width: '320px' }}>
        {renderSidebarContent()}
      </div>

      <div className={`flex-1 flex flex-col overflow-hidden ${!showChatOnMobile && !activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat && activePanel === 'chats' ? (
          <ChatWindow chat={activeChat} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-primary-600/20 rounded-3xl flex items-center justify-center mb-6">
              <MessageCircle size={44} className="text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-200 mb-2">KAYFQIL</h2>
            <p className="text-gray-500 max-w-xs leading-relaxed">
              Xabar yuborish uchun chapdan chat tanlang yoki yangi chat boshlang
            </p>
            <div className="mt-6 flex gap-3">
              <div className="flex items-center gap-2 bg-dark-800 rounded-xl px-4 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-xs text-gray-400">End-to-end shifrlangan</span>
              </div>
              <div className="flex items-center gap-2 bg-dark-800 rounded-xl px-4 py-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-xs text-gray-400">Real-time xabar</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainLayout;
