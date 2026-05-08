import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { setCallState, setIncomingCall } from '../../store/slices/uiSlice';
import { getSocket } from '../../socket';
import Avatar from './Avatar';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const CallModal = () => {
  const dispatch = useDispatch();
  const { callState, incomingCall } = useSelector((s) => s.ui);
  const socket = getSocket();

  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const localRef = useRef();
  const remoteRef = useRef();
  const peerRef = useRef();
  const timerRef = useRef();
  const targetUserIdRef = useRef();
  const callStateRef = useRef(callState);

  useEffect(() => { callStateRef.current = callState; }, [callState]);

  // Sync local stream → video element whenever stream or callState changes
  useEffect(() => {
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  // Sync remote stream → video element
  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const formatDur = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const cleanupMedia = () => {
    localStream?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    peerRef.current = null;
    clearInterval(timerRef.current);
  };

  const endCall = useCallback(() => {
    const targetId = targetUserIdRef.current;
    cleanupMedia();
    setLocalStream(null);
    setRemoteStream(null);
    setDuration(0);
    if (targetId) socket?.emit('call:end', { targetUserId: targetId });
    dispatch(setCallState(null));
    dispatch(setIncomingCall(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, dispatch]);

  const createPC = useCallback((targetUserId) => {
    targetUserIdRef.current = targetUserId;
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit('call:ice-candidate', { targetUserId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall();
      }
    };

    peerRef.current = pc;
    return pc;
  }, [socket, endCall]);

  // Outgoing call: get stream + create offer
  useEffect(() => {
    if (!callState || callState.status !== 'calling') return;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callState.type === 'video',
        });
        setLocalStream(stream);

        const pc = createPC(callState.targetUser._id);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket?.emit('call:invite', {
          targetUserId: callState.targetUser._id,
          chatId: callState.chatId,
          callType: callState.type,
          offer,
        });
      } catch (err) {
        console.error('Camera/mic error:', err);
        endCall();
      }
    };

    start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState?.chatId]);

  // Socket: receive answer + ICE candidates + end
  useEffect(() => {
    if (!socket) return;

    const onAnswered = async ({ answer }) => {
      try {
        if (peerRef.current && answer) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
        dispatch(setCallState({ ...callStateRef.current, status: 'connected' }));
        startTimer();
      } catch (err) {
        console.error('setRemoteDescription error:', err);
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      try {
        if (peerRef.current && candidate) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (_) {}
    };

    const onEnded = () => endCall();

    socket.on('call:answered', onAnswered);
    socket.on('call:ice-candidate', onIceCandidate);
    socket.on('call:ended', onEnded);

    return () => {
      socket.off('call:answered', onAnswered);
      socket.off('call:ice-candidate', onIceCandidate);
      socket.off('call:ended', onEnded);
    };
  }, [socket, dispatch, endCall]);

  useEffect(() => () => cleanupMedia(), []);

  // Incoming call: answer button
  const answerCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === 'video',
      });

      // Set stream state first — video elements will sync via useEffect after re-render
      setLocalStream(stream);

      const pc = createPC(incomingCall.from._id);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      if (incomingCall.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket?.emit('call:answer', { targetUserId: incomingCall.from._id, answer });
      }

      dispatch(setCallState({ ...incomingCall, status: 'connected', targetUser: incomingCall.from }));
      dispatch(setIncomingCall(null));
      startTimer();
    } catch (err) {
      console.error('Answer error:', err);
    }
  };

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach((t) => { t.enabled = muted; });
    setMuted((m) => !m);
  };

  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach((t) => { t.enabled = cameraOff; });
    setCameraOff((c) => !c);
  };

  // ── Incoming call screen ──
  if (incomingCall && !callState) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-dark-800 rounded-3xl p-8 w-full max-w-xs text-center shadow-2xl">
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
      {/* ── Video screens ── */}
      {isVideo && (
        <>
          {/* Remote video (big) */}
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover bg-dark-900"
          />
          {/* Local video (small corner) */}
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            className="absolute top-4 right-4 w-32 h-44 rounded-2xl object-cover border-2 border-white/20 z-10 bg-dark-800 shadow-xl"
          />
        </>
      )}

      {/* ── Center info ── */}
      <div className="flex flex-col items-center justify-center flex-1 z-10">
        {(!isVideo || !remoteStream) && (
          <>
            <Avatar user={callState.targetUser} size="xl" className="mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">{callState.targetUser?.firstName}</h3>
          </>
        )}
        <p className={`text-sm ${isVideo && remoteStream ? 'text-white bg-black/50 px-3 py-1 rounded-full' : 'text-gray-400'}`}>
          {callState.status === 'calling'
            ? 'Qo\'ng\'iroq qilinmoqda...'
            : callState.status === 'connected'
            ? formatDur(duration)
            : 'Ulanmoqda...'}
        </p>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center justify-center gap-5 pb-14 z-10">
        <button
          onClick={toggleMute}
          className={`w-13 h-13 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${muted ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}
        >
          {muted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
        </button>

        {isVideo && (
          <button
            onClick={toggleCamera}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${cameraOff ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}
          >
            {cameraOff ? <VideoOff size={20} className="text-white" /> : <Video size={20} className="text-white" />}
          </button>
        )}

        <button
          onClick={endCall}
          className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
        >
          <PhoneOff size={26} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default CallModal;
