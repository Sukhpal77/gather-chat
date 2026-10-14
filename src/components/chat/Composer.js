'use client';
import { useEffect, useRef, useState } from 'react';
import { Paperclip, Smile, Mic, Send, X, Square } from 'lucide-react';
import { api } from '@/lib/client-api';
import { fileSize } from '@/lib/format';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

export default function Composer({ conversationId, socket, connected, onSent, reportError }) {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const input = useRef(null);
  const fileInput = useRef(null);
  const retryId = useRef(null);
  const typingTimeout = useRef(null);
  const voice = useVoiceRecorder(upload, reportError);
  useEffect(() => () => clearTimeout(typingTimeout.current), []);
  async function upload(file) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return reportError('Choose a file smaller than 8 MB.');
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const data = await api('/files', { method: 'POST', body });
      setAttachment(data.attachment);
      retryId.current = null;
    } catch (error) {
      reportError(error.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }
  function updateText(value) {
    setText(value);
    retryId.current = null;
    socket.current?.emit('typing', { conversationId, active: value.length > 0 });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(
      () => socket.current?.emit('typing', { conversationId, active: false }),
      1800,
    );
  }
  async function submit(event) {
    event.preventDefault();
    if ((!text.trim() && !attachment) || sending || uploading) return;
    setSending(true);
    const clientId = retryId.current || crypto.randomUUID();
    retryId.current = clientId;
    const body = { text: text.trim(), attachmentId: attachment?.id, clientId };
    try {
      let data;
      if (connected) {
        try {
          data = await socket.current
            .timeout(8000)
            .emitWithAck('message:send', { ...body, conversationId });
        } catch {
          data = await api(`/conversations/${conversationId}/messages`, { method: 'POST', body });
        }
        if (data.error) throw new Error(data.error);
      } else
        data = await api(`/conversations/${conversationId}/messages`, { method: 'POST', body });
      onSent(data.message);
      setText('');
      setAttachment(null);
      retryId.current = null;
      socket.current?.emit('typing', { conversationId, active: false });
      input.current?.focus();
    } catch (error) {
      reportError(error.message);
    } finally {
      setSending(false);
    }
  }
  return (
    <div className="composer-area">
      {attachment && (
        <div className="attachment-preview">
          <Paperclip size={16} />
          <span>
            {attachment.name}
            <small>{fileSize(attachment.size)}</small>
          </span>
          <button
            className="icon-button"
            aria-label="Remove attachment"
            onClick={() => {
              setAttachment(null);
              retryId.current = null;
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {uploading && (
        <p className="composer-status" role="status">
          Uploading your file…
        </p>
      )}
      {emojiOpen && (
        <div className="emoji-picker" aria-label="Emoji picker">
          {['😊', '❤️', '🙌', '✨', '👍', '☕', '🎉', '👋', '💡', '😂', '🌿', '🚀'].map((emoji) => (
            <button
              key={emoji}
              aria-label={`Insert ${emoji}`}
              onClick={() => {
                updateText(text + emoji);
                setEmojiOpen(false);
                input.current?.focus();
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <form className="composer" onSubmit={submit}>
        <input
          ref={fileInput}
          type="file"
          className="visually-hidden"
          tabIndex={-1}
          accept="image/png,image/jpeg,image/webp,image/gif,audio/*,application/pdf,text/plain"
          onChange={(e) => upload(e.target.files[0])}
        />
        <button
          className="icon-button"
          type="button"
          aria-label="Attach a file"
          disabled={uploading || sending || voice.recording}
          onClick={() => fileInput.current?.click()}
        >
          <Paperclip size={20} />
        </button>
        {voice.recording ? (
          <div className="recording-status">
            <span className="recording-dot" />
            Recording {Math.floor(voice.seconds / 60)}:{String(voice.seconds % 60).padStart(2, '0')}
            <button type="button" className="text-button" onClick={() => voice.stop(true)}>
              Cancel
            </button>
          </div>
        ) : (
          <textarea
            ref={input}
            aria-label="Message"
            rows={1}
            placeholder="Write a little something…"
            maxLength={4000}
            value={text}
            disabled={sending}
            onChange={(e) => updateText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit(e);
              }
            }}
          />
        )}
        <button
          className={`icon-button ${emojiOpen ? 'active' : ''}`}
          type="button"
          aria-label="Choose an emoji"
          onClick={() => setEmojiOpen(!emojiOpen)}
          disabled={voice.recording}
        >
          <Smile size={20} />
        </button>
        <button
          className={`icon-button ${voice.recording ? 'recording' : ''}`}
          type="button"
          aria-label={voice.recording ? 'Stop recording' : 'Record a voice message'}
          onClick={() => (voice.recording ? voice.stop() : voice.start())}
          disabled={uploading || sending || voice.starting}
        >
          {voice.recording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
        </button>
        <span className="composer-divider" />
        <button
          className="send-button"
          aria-label="Send message"
          disabled={sending || uploading || voice.recording || (!text.trim() && !attachment)}
        >
          <Send size={19} />
        </button>
      </form>
      <div className="composer-hint">
        <span>Enter to send · Shift + Enter for a new line</span>
        <span>
          Make someone’s day. Say hello. <span>✳</span>
        </span>
      </div>
    </div>
  );
}
