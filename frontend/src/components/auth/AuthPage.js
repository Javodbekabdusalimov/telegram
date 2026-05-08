import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, ArrowRight, RefreshCw, User } from 'lucide-react';
import { sendOTP, verifyOTP, clearError, resetOtp, updateProfile } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const AuthPage = () => {
  const dispatch = useDispatch();
  const { loading, error, otpSent, devOtp, needsProfile } = useSelector((s) => s.auth);

  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);
  useEffect(() => { if (otpSent && devOtp) toast(`OTP: ${devOtp}`, { icon: '🔑', duration: 15000 }); }, [otpSent, devOtp]);
  useEffect(() => { if (otpSent) setStep('otp'); }, [otpSent]);
  useEffect(() => { if (needsProfile) setStep('register'); }, [needsProfile]);
  useEffect(() => {
    let t;
    if (countdown > 0) t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleSendOTP = async () => {
    const cleaned = phone.trim();
    if (!cleaned) return toast.error('Telefon raqamini kiriting');
    const result = await dispatch(sendOTP(cleaned));
    if (!result.error) setCountdown(60);
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) return toast.error('6 raqamli kodni kiriting');
    await dispatch(verifyOTP({ phone: phone.trim(), otp }));
  };

  const handleRegister = async () => {
    if (!firstName.trim()) return toast.error('Ismingizni kiriting');
    const formData = new FormData();
    formData.append('firstName', firstName.trim());
    if (lastName.trim()) formData.append('lastName', lastName.trim());
    const result = await dispatch(updateProfile(formData));
    if (!result.error) toast.success('Xush kelibsiz!');
  };

  const handleResend = () => {
    if (countdown > 0) return;
    dispatch(resetOtp()); setOtp(''); setStep('phone');
    setTimeout(() => handleSendOTP(), 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #fdf4ff 100%)' }}>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.97c-.12.57-.46.71-.93.44l-2.58-1.9-1.24 1.2c-.14.14-.26.26-.52.26l.18-2.6 4.74-4.28c.21-.18-.04-.28-.32-.1L7.46 14.5l-2.54-.8c-.55-.17-.56-.55.12-.82l9.91-3.82c.46-.17.86.11.69.74z"
                fill="white"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#7c3aed' }}>JAVOGRAM</h1>
          <p className="text-gray-500 text-sm">Tez, xavfsiz, qulay</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {['phone','otp','register'].map((s, i) => (
            <div key={s} className="rounded-full transition-all duration-300"
              style={{
                width: step === s ? 24 : 8, height: 8,
                background: step === s ? '#7c3aed' : ['phone','otp','register'].indexOf(step) > i ? '#c4b5fd' : '#e5e7eb'
              }} />
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-50">

          {/* PHONE */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Telefon raqam</h2>
                <p className="text-gray-400 text-sm mb-4">Tasdiqlash kodi yuboramiz</p>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67" className="input-field pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()} autoFocus />
                </div>
              </div>
              <button onClick={handleSendOTP} disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <><span>Kod yuborish</span><ArrowRight size={18} /></>}
              </button>
            </div>
          )}

          {/* OTP */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Tasdiqlash kodi</h2>
                <p className="text-gray-400 text-sm mb-4">
                  <span style={{ color: '#7c3aed' }}>{phone}</span> ga yuborildi
                </p>
                {devOtp && (
                  <div className="rounded-xl px-4 py-2.5 mb-3 text-center border"
                    style={{ background: '#fef9c3', borderColor: '#fde047' }}>
                    <span className="text-yellow-600 text-xs">Test kod: </span>
                    <span className="text-yellow-700 font-bold text-xl tracking-widest">{devOtp}</span>
                  </div>
                )}
                <input type="text" inputMode="numeric" value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="• • • • • •"
                  className="input-field text-center text-3xl tracking-[0.6em] font-bold py-4"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()} autoFocus maxLength={6} />
              </div>
              <button onClick={handleVerifyOTP} disabled={loading || otp.length < 6}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <RefreshCw size={18} className="animate-spin" /> : 'Tasdiqlash'}
              </button>
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => { dispatch(resetOtp()); setStep('phone'); setOtp(''); }}
                  className="text-gray-400 hover:text-gray-600 text-sm transition-colors">← Orqaga</button>
                <button onClick={handleResend} disabled={countdown > 0}
                  className="text-sm disabled:opacity-40 transition-colors"
                  style={{ color: '#7c3aed' }}>
                  {countdown > 0 ? `Qayta (${countdown}s)` : 'Qayta yuborish'}
                </button>
              </div>
            </div>
          )}

          {/* REGISTER */}
          {step === 'register' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Ismingiz</h2>
                <p className="text-gray-400 text-sm mb-4">Profilingizni to'ldiring</p>
              </div>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ism *" className="input-field pl-10" autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
              </div>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                placeholder="Familiya (ixtiyoriy)" className="input-field"
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()} />
              <button onClick={handleRegister} disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <RefreshCw size={18} className="animate-spin" /> : 'Boshlash 🚀'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-5">JAVOGRAM v1.0 · Barcha huquqlar himoyalangan</p>
      </div>
    </div>
  );
};

export default AuthPage;
