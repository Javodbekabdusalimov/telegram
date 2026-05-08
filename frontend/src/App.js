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
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: '3px' }} />
          <p className="text-gray-500 text-sm">KAYFQIL yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated && !needsProfile ? <MainLayout /> : <AuthPage />;
}

export default App;
