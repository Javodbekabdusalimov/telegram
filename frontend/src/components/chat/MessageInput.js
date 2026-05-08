import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paperclip, Mic, Send, Image, FileText, MapPin, X,
  Square, Play, Smile,
} from 'lucide-react';
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
    if (editingMessage) {
      setText(editingMessage.content || '');
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const handleTyping = useCallback(() => {
    socket?.emit('message:typing', { chatId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('message:typing', { chatId, isTyping: false });
    }, 2000);
  }, [socket, chatId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !audioBlob) return;

    socket?.emit('message:typing', { chatId, isTyping: false });

    if (editingMessage) {
      if (trimmed) {
        const result = await dispatch(editMessage({ chatId, messageId: editingMessage._id, content: trimmed }));
        if (!result.error) {
          dispatch(setEditingMessage(null));
          setText('');
        }
      }
      return;
    }

    if (audioBlob) {
      const formData = new FormData();
      formData.append('media', audioBlob, 'voice.webm');
      formData.append('type', 'voice');
      if (replyTo) formData.append('replyTo', replyTo._id);
      const result = await dispatch(sendMessage({ chatId, formData }));
      if (!result.error) {
        setAudioBlob(null);
        dispatch(setReplyTo(null));
        if (result.payload) dispatch(updateLastMessage({ chatId, message: result.payload }));
      }
      return;
    }

    const formData = new FormData();
    formData.append('content', trimmed);
    formData.append('type', 'text');
    if (replyTo) formData.append('replyTo', replyTo._id);

    setText('');
    dispatch(setReplyTo(null));
    const result = await dispatch(sendMessage({ chatId, formData }));
    if (!result.error && result.payload) {
      dispatch(updateLastMessage({ chatId, message: result.payload }));
    }
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
    if (!result.error && result.payload) {
      dispatch(updateLastMessage({ chatId, message: result.payload }));
    }

    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (err) {
      console.error('Mic access denied', err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const cancelRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setAudioBlob(null);
    chunksRef.current = [];
    clearInterval(timerRef.current);
    setRecordingTime(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiObject) => {
    setText((prev) => prev + emojiObject.emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-dark-700 bg-dark-900">
      {(replyTo || editingMessage) && (
        <div className="flex items-start gap-3 px-4 py-2 bg-dark-800 border-b border-dark-700">
          <div className="border-l-2 border-primary-500 pl-3 flex-1">
            <p className="text-primary-400 text-xs font-medium mb-0.5">
              {editingMessage ? 'Tahrirlash' : `Javob: ${replyTo?.sender?.firstName}`}
            </p>
            <p className="text-gray-400 text-sm truncate">
              {editingMessage?.content || replyTo?.content || 'Media'}
            </p>
          </div>
          <button
            onClick={() => { dispatch(setReplyTo(null)); dispatch(setEditingMessage(null)); setText(''); }}
            className="text-gray-500 hover:text-gray-300 mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {audioBlob && !recording && (
        <div className="flex items-center gap-3 px-4 py-2 bg-dark-800 border-b border-dark-700">
          <Play size={18} className="text-primary-400" />
          <div className="flex-1">
            <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 w-full" />
          </div>
          <button onClick={() => setAudioBlob(null)} className="text-gray-500 hover:text-gray-300">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-3">
        {!recording && (
          <div className="relative">
            <button
              onClick={() => setShowAttach(!showAttach)}
              className="btn-ghost p-2 rounded-xl"
            >
              <Paperclip size={20} />
            </button>
            {showAttach && (
              <div className="absolute bottom-12 left-0 bg-dark-700 rounded-2xl shadow-2xl border border-dark-600 p-3 grid grid-cols-3 gap-3 w-48 z-40">
                <button
                  onClick={() => { imageRef.current.click(); }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-dark-600 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Image size={18} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-300">Rasm</span>
                </button>
                <button
                  onClick={() => { fileRef.current.click(); }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-dark-600 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                    <FileText size={18} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-300">Fayl</span>
                </button>
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        const formData = new FormData();
                        formData.append('type', 'location');
                        formData.append('content', JSON.stringify({
                          latitude: pos.coords.latitude,
                          longitude: pos.coords.longitude,
                        }));
                        await dispatch(sendMessage({ chatId, formData }));
                        setShowAttach(false);
                      });
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-dark-600 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <MapPin size={18} className="text-white" />
                  </div>
                  <span className="text-xs text-gray-300">Joylashuv</span>
                </button>
              </div>
            )}
          </div>
        )}

        <input ref={imageRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFileChange(e, e.target.files[0]?.type?.startsWith('image') ? 'image' : 'video')} />
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => handleFileChange(e, 'file')} />

        {recording ? (
          <div className="flex-1 flex items-center gap-3 bg-dark-800 rounded-2xl px-4 py-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-medium">{formatDuration(recordingTime)}</span>
            <span className="text-gray-400 text-sm flex-1">Yozilmoqda...</span>
            <button onClick={cancelRecording} className="text-gray-500 hover:text-gray-300">
              <X size={18} />
            </button>
            <button onClick={stopRecording} className="text-primary-400 hover:text-primary-300">
              <Square size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="relative flex-1">
              <button
                onClick={() => setShowEmoji(!showEmoji)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <Smile size={18} />
              </button>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => { setText(e.target.value); handleTyping(); }}
                onKeyDown={handleKeyDown}
                placeholder="Xabar yozish..."
                rows={1}
                className="input-field pl-10 pr-4 py-3 resize-none min-h-[48px] max-h-[180px] overflow-y-auto leading-6"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
                }}
              />
              {showEmoji && (
                <div className="absolute bottom-14 left-0 z-50">
                  <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" height={360} />
                </div>
              )}
            </div>
          </>
        )}

        {text.trim() || audioBlob ? (
          <button onClick={handleSend} className="w-11 h-11 bg-primary-600 hover:bg-primary-700 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
            <Send size={18} className="text-white" />
          </button>
        ) : (
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${recording ? 'bg-red-600' : 'bg-dark-700 hover:bg-dark-600'}`}
          >
            <Mic size={18} className={recording ? 'text-white' : 'text-gray-300'} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
