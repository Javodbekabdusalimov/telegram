import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Phone, ArrowRight, RefreshCw, User } from 'lucide-react';
import { sendOTP, verifyOTP, clearError, resetOtp, updateProfile } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

// step: 'phone' | 'otp' | 'register'
const AuthPage = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { loading, error, otpSent, devOtp, needsProfile } = useSelector((s) => s.auth);

  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  useEffect(() => {
    if (otpSent && devOtp) {
      toast(`OTP kod: ${devOtp}`, { icon: '🔑', duration: 15000 });
    }
  }, [otpSent, devOtp]);

  useEffect(() => {
    if (otpSent) setStep('otp');
  }, [otpSent]);

  useEffect(() => {
    if (needsProfile) setStep('register');
  }, [needsProfile]);

  useEffect(() => {
    let timer;
    if (countdown > 0) timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOTP = async () => {
    const cleaned = phone.trim();
    if (!cleaned) return toast.error('Telefon raqamini kiriting');
    const result = await dispatch(sendOTP(cleaned));
    if (!result.error) setCountdown(60);
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) return toast.error('6 raqamli kodni kiriting');
    const result = await dispatch(verifyOTP({ phone: phone.trim(), otp }));
    if (!result.error) {
      if (result.payload?.isNewUser) {
        setStep('register');
      }
      // agar yangi user emas — to'g'ridan-to'g'ri kiradi (authSlice isAuthenticated=true qiladi)
    }
  };

  const handleRegister = async () => {
    if (!firstName.trim()) return toast.error('Ismingizni kiriting');
    const formData = new FormData();
    formData.append('firstName', firstName.trim());
    if (lastName.trim()) formData.append('lastName', lastName.trim());
    const result = await dispatch(updateProfile(formData));
    if (!result.error) toast.success('Xush kelibsiz!');
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    dispatch(resetOtp());
    setOtp('');
    setStep('phone');
    setTimeout(() => handleSendOTP(), 100);
  };

  const stepDots = ['phone', 'otp', 'register'];

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/30">
            <MessageCircle size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">KAYFQIL</h1>
          <p className="text-gray-500 text-sm">Dunyo bilan bog'laning</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {stepDots.map((s, i) => (
            <div
              key={s}
              className={`rounded-full transition-all duration-300 ${
                step === s
                  ? 'w-6 h-2 bg-primary-500'
                  : stepDots.indexOf(step) > i
                  ? 'w-2 h-2 bg-primary-700'
                  : 'w-2 h-2 bg-dark-600'
              }`}
            />
          ))}
        </div>

        <div className="bg-dark-800 rounded-2xl p-6 shadow-xl">

          {/* ── STEP 1: PHONE ── */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Telefon raqam</h2>
                <p className="text-gray-500 text-sm mb-4">SMS kod yuboramiz</p>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="input-field pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                    autoFocus
                  />
                </div>
              </div>
              <button onClick={handleSendOTP} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading
                  ? <RefreshCw size={18} className="animate-spin" />
                  : <><span>Kod yuborish</span><ArrowRight size={18} /></>
                }
              </button>
            </div>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">SMS kod</h2>
                <p className="text-gray-500 text-sm mb-4">
                  <span className="text-primary-400">{phone}</span> ga yuborildi
                </p>
                {devOtp && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 mb-3 text-center">
                    <span className="text-yellow-400 text-xs">Test kod: </span>
                    <span className="text-yellow-300 font-bold text-lg tracking-widest">{devOtp}</span>
                  </div>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="input-field text-center text-3xl tracking-[0.6em] font-bold py-4"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  autoFocus
                  maxLength={6}
                />
              </div>
              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length < 6}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : 'Tasdiqlash'}
              </button>
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => { dispatch(resetOtp()); setStep('phone'); setOtp(''); }}
                  className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                >
                  ← Orqaga
                </button>
                <button
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className="text-primary-400 hover:text-primary-300 text-sm disabled:opacity-40 transition-colors"
                >
                  {countdown > 0 ? `Qayta yuborish (${countdown}s)` : 'Qayta yuborish'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: REGISTER (yangi user) ── */}
          {step === 'register' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Ismingiz</h2>
                <p className="text-gray-500 text-sm mb-4">Profil ma'lumotlarini kiriting</p>
              </div>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ism *"
                  className="input-field pl-10"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Familiya (ixtiyoriy)"
                className="input-field"
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              />
              <button onClick={handleRegister} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <RefreshCw size={18} className="animate-spin" /> : 'Boshlash 🚀'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-gray-700 text-xs mt-5">
          KAYFQIL v1.0 · Barcha huquqlar himoyalangan
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
