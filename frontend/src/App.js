import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from './store/slices/authSlice';
import AuthPage from './components/auth/AuthPage';
import MainLayout from './pages/MainLayout';
import './i18n';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, isInitializing, needsProfile } = useSelector((s) => s.auth);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) dispatch(getMe());
  }, [dispatch]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.97c-.12.57-.46.71-.93.44l-2.58-1.9-1.24 1.2c-.14.14-.26.26-.52.26l.18-2.6 4.74-4.28c.21-.18-.04-.28-.32-.1L7.46 14.5l-2.54-.8c-.55-.17-.56-.55.12-.82l9.91-3.82c.46-.17.86.11.69.74z" fill="white"/>
            </svg>
          </div>
          <p className="text-sm font-semibold" style={{ color: '#7c3aed' }}>JAVOGRAM</p>
        </div>
      </div>
    );
  }

  return isAuthenticated && !needsProfile ? <MainLayout /> : <AuthPage />;
}

export default App;
