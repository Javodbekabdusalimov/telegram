import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { setCallState, setIncomingCall } from '../../store/slices/uiSlice';
import { getSocket } from '../../socket';
import Avatar from './Avatar';

const CallModal = () => {
  const dispatch = useDispatch();
  const { callState, incomingCall } = useSelector((s) => s.ui);
  const socket = getSocket();
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const localRef = useRef();
  const remoteRef = useRef();
  const peerRef = useRef();
  const streamRef = useRef();
  const timerRef = useRef();

  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    peerRef.current?.close();
    clearInterval(timerRef.current);
    socket?.emit('call:end', {
      targetUserId: callState?.targetUser?._id || incomingCall?.from?._id,
    });
    dispatch(setCallState(null));
    dispatch(setIncomingCall(null));
    setDuration(0);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const formatDuration = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const answerCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: incomingCall?.callType === 'video',
    });
    streamRef.current = stream;
    if (localRef.current) localRef.current.srcObject = stream;

    dispatch(setCallState({
      ...incomingCall,
      status: 'connected',
      targetUser: incomingCall.from,
    }));
    dispatch(setIncomingCall(null));
    startTimer();
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => { t.enabled = muted; });
      setMuted(!muted);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => { t.enabled = cameraOff; });
      setCameraOff(!cameraOff);
    }
  };

  useEffect(() => {
    socket?.on('call:ended', endCall);
    socket?.on('call:answered', () => { startTimer(); });
    return () => {
      socket?.off('call:ended');
      socket?.off('call:answered');
    };
  }, [socket]);

  useEffect(() => () => { clearInterval(timerRef.current); streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  if (incomingCall) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-dark-800 rounded-3xl p-8 w-full max-w-xs text-center shadow-2xl animate-bounce-in">
          <p className="text-gray-400 text-sm mb-4">
            {incomingCall.callType === 'video' ? 'Video qo\'ng\'iroq' : 'Ovozli qo\'ng\'iroq'}
          </p>
          <Avatar user={incomingCall.from} size="xl" className="mx-auto mb-4" showOnline />
          <h3 className="text-xl font-bold text-white mb-2">{incomingCall.from?.firstName}</h3>
          <p className="text-gray-400 text-sm mb-8">Kiruvchi qo'ng'iroq...</p>
          <div className="flex items-center justify-center gap-6">
            <button onClick={endCall} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
              <PhoneOff size={22} className="text-white" />
            </button>
            <button onClick={answerCall} className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors animate-pulse">
              <Phone size={22} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!callState) return null;

  const isVideo = callState.type === 'video';

  return (
    <div className="fixed inset-0 z-50 bg-dark-950 flex flex-col">
      {isVideo && (
        <>
          <video ref={remoteRef} autoPlay className="absolute inset-0 w-full h-full object-cover" />
          <video ref={localRef} autoPlay muted className="absolute top-4 right-4 w-28 h-36 rounded-xl object-cover border-2 border-dark-700" />
        </>
      )}

      <div className={`flex flex-col items-center justify-center flex-1 ${isVideo ? 'bg-transparent' : 'bg-dark-950'}`}>
        <Avatar user={callState.targetUser} size="xl" className="mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">{callState.targetUser?.firstName}</h3>
        <p className="text-gray-400">
          {callState.status === 'calling' ? 'Qo\'ng\'iroq qilinmoqda...' :
           callState.status === 'connected' ? formatDuration(duration) : 'Ulanmoqda...'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 pb-12">
        <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center ${muted ? 'bg-red-500' : 'bg-dark-700'}`}>
          {muted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
        </button>
        {isVideo && (
          <button onClick={toggleCamera} className={`w-12 h-12 rounded-full flex items-center justify-center ${cameraOff ? 'bg-red-500' : 'bg-dark-700'}`}>
            {cameraOff ? <VideoOff size={20} className="text-white" /> : <Video size={20} className="text-white" />}
          </button>
        )}
        <button onClick={endCall} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
          <PhoneOff size={26} className="text-white" />
        </button>
        <button className="w-12 h-12 bg-dark-700 rounded-full flex items-center justify-center">
          <Volume2 size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default CallModal;
