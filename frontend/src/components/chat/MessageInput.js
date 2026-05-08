import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Paperclip, Mic, Send, Image, FileText, MapPin, X, Square, Play, Smile } from 'lucide-react';
import { sendMessage, setReplyTo, setEditingMessage, editMessage } from '../../store/slices/messageSlice';
import { updateLastMessage } from '../../store/slices/chatSlice';
import { getSocket } from '../../socket';
import { formatDuration, getMediaUrl } from '../../utils/helpers';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({ chatId }) => {
  const dispatch = useDispatch();
  const { replyTo, editingMessage } = useSelector((s) => s.message);
  const { user } = useSelector((s) => s.auth);
  const socket = getSocket();

  const [text, setText] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);

  const fileRef = useRef();
  const imageRef = useRef();
  const mediaRecorderRef = useRef();
  const chunksRef = useRef([]);
  const timerRef = useRef();
  const typingTimeoutRef = useRef();
  const textareaRef = useRef();

  useEffect(() => {
    if (editingMessage) { setText(editingMessage.content || ''); textareaRef.current?.focus(); }
  }, [editingMessage]);

  const handleTyping = useCallback(() => {
    socket?.emit('message:typing', { chatId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket?.emit('message:typing', { chatId, isTyping: false }), 2000);
  }, [socket, chatId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !audioBlob) return;
    socket?.emit('message:typing', { chatId, isTyping: false });
    if (editingMessage) {
      if (trimmed) {
        const result = await dispatch(editMessage({ chatId, messageId: editingMessage._id, content: trimmed }));
        if (!result.error) { dispatch(setEditingMessage(null)); setText(''); }
      }
      return;
    }
    if (audioBlob) {
      const formData = new FormData();
      formData.append('media', audioBlob, 'voice.webm');
      formData.append('type', 'voice');
      if (replyTo) formData.append('replyTo', replyTo._id);
      const result = await dispatch(sendMessage({ chatId, formData }));
      if (!result.error) { setAudioBlob(null); dispatch(setReplyTo(null)); if (result.payload) dispatch(updateLastMessage({ chatId, message: result.payload })); }
      return;
    }
    const formData = new FormData();
    formData.append('content', trimmed);
    formData.append('type', 'text');
    if (replyTo) formData.append('replyTo', replyTo._id);
    setText('');
    dispatch(setReplyTo(null));
    const result = await dispatch(sendMessage({ chatId, formData }));
    if (!result.error && result.payload) dispatch(updateLastMessage({ chatId, message: result.payload }));
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('media', file);
    formData.append('type', type);
    if (replyTo) formData.append('replyTo', replyTo._id);
    setShowAttach(false);
    dispatch(setReplyTo(null));
    const result = await dispatch(sendMessage({ chatId, formData }));
    if (!result.error && result.payload) dispatch(updateLastMessage({ chatId, message: result.payload }));
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => { setAudioBlob(new Blob(chunksRef.current, { type: 'audio/webm' })); stream.getTracks().forEach((t) => t.stop()); };
      recorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (err) { console.error('Mic access denied', err); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); clearInterval(timerRef.current); };
  const cancelRecording = () => {
    mediaRecorderRef.current?.stop(); setRecording(false); setAudioBlob(null);
    chunksRef.current = []; clearInterval(timerRef.current); setRecordingTime(0);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const onEmojiClick = (obj) => { setText((p) => p + obj.emoji); setShowEmoji(false); textareaRef.current?.focus(); };

  return (
    <div className="bg-white border-t border-gray-100">
      {/* Reply / Edit bar */}
      {(replyTo || editingMessage) && (
        <div className="flex items-start gap-3 px-4 py-2 border-b border-gray-100" style={{ background: '#faf9ff' }}>
          <div className="border-l-2 pl-3 flex-1" style={{ borderColor: '#7c3aed' }}>
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#7c3aed' }}>
              {editingMessage ? 'Tahrirlash' : `Javob: ${replyTo?.sender?.firstName}`}
            </p>
            <p className="text-gray-500 text-sm truncate">{editingMessage?.content || replyTo?.content || 'Media'}</p>
          </div>
          <button onClick={() => { dispatch(setReplyTo(null)); dispatch(setEditingMessage(null)); setText(''); }}
            className="text-gray-400 hover:text-gray-600 mt-0.5"><X size={16} /></button>
        </div>
      )}

      {/* Audio preview */}
      {audioBlob && !recording && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100" style={{ background: '#faf9ff' }}>
          <Play size={18} style={{ color: '#7c3aed' }} />
          <div className="flex-1">
            <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 w-full" />
          </div>
          <button onClick={() => setAudioBlob(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-3">
        {/* Attach */}
        {!recording && (
          <div className="relative">
            <button onClick={() => setShowAttach(!showAttach)} className="btn-ghost p-2 rounded-xl">
              <Paperclip size={20} />
            </button>
            {showAttach && (
              <div className="absolute bottom-12 left-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 grid grid-cols-3 gap-3 w-48 z-40">
                <button onClick={() => imageRef.current.click()}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-purple-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Image size={18} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-600">Rasm</span>
                </button>
                <button onClick={() => fileRef.current.click()}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-purple-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                    <FileText size={18} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-600">Fayl</span>
                </button>
                <button onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        const formData = new FormData();
                        formData.append('type', 'location');
                        formData.append('content', JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                        await dispatch(sendMessage({ chatId, formData }));
                        setShowAttach(false);
                      });
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-purple-50 transition-colors">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <MapPin size={18} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-600">Joylashuv</span>
                </button>
              </div>
            )}
          </div>
        )}

        <input ref={imageRef} type="file" accept="image/*,video/*" className="hidden"
          onChange={(e) => handleFileChange(e, e.target.files[0]?.type?.startsWith('image') ? 'image' : 'video')} />
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => handleFileChange(e, 'file')} />

        {recording ? (
          <div className="flex-1 flex items-center gap-3 bg-red-50 rounded-2xl px-4 py-3 border border-red-100">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-500 font-semibold">{formatDuration(recordingTime)}</span>
            <span className="text-gray-400 text-sm flex-1">Yozilmoqda...</span>
            <button onClick={cancelRecording} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <button onClick={stopRecording} style={{ color: '#7c3aed' }}><Square size={18} /></button>
          </div>
        ) : (
          <div className="relative flex-1">
            <button onClick={() => setShowEmoji(!showEmoji)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <Smile size={18} />
            </button>
            <textarea ref={textareaRef} value={text} onChange={(e) => { setText(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown} placeholder="Xabar yozish..." rows={1}
              className="input-field pl-10 pr-4 py-3 resize-none min-h-[48px] max-h-[180px] overflow-y-auto leading-6"
              style={{ borderRadius: 14, height: 'auto' }}
              onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px'; }} />
            {showEmoji && (
              <div className="absolute bottom-14 left-0 z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} theme="light" height={360} />
              </div>
            )}
          </div>
        )}

        {text.trim() || audioBlob ? (
          <button onClick={handleSend}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 shadow-md"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
            <Send size={18} className="text-white" />
          </button>
        ) : (
          <button onMouseDown={startRecording} onMouseUp={stopRecording}
            onTouchStart={startRecording} onTouchEnd={stopRecording}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${recording ? '' : 'bg-gray-100 hover:bg-gray-200'}`}
            style={recording ? { background: 'linear-gradient(135deg,#ef4444,#f97316)' } : {}}>
            <Mic size={18} className={recording ? 'text-white' : 'text-gray-500'} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
