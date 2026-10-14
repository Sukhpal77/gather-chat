'use client';
import { useEffect, useRef, useState } from 'react';

export function useVoiceRecorder(onRecorded, reportError) {
  const recorder = useRef(null);
  const stream = useRef(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timer = useRef(null);
  const discarded = useRef(false);
  const mounted = useRef(false);
  const startingRef = useRef(false);
  const [starting, setStarting] = useState(false);
  function release() {
    stream.current?.getTracks().forEach((track) => track.stop());
    clearInterval(timer.current);
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      discarded.current = true;
      if (recorder.current?.state === 'recording') recorder.current.stop();
      release();
    };
  }, []);
  async function start() {
    if (startingRef.current || recorder.current?.state === 'recording') return;
    startingRef.current = true;
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
        throw new Error('Voice recording needs HTTPS or localhost and a supported browser.');
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        release();
        return;
      }
      const mime = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const instance = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      discarded.current = false;
      instance.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      instance.onstop = () => {
        release();
        if (mounted.current) setRecording(false);
        if (discarded.current || !mounted.current) return;
        const type = (instance.mimeType || 'audio/webm').split(';')[0];
        const extension = type === 'audio/mp4' ? 'm4a' : type === 'audio/ogg' ? 'ogg' : 'webm';
        onRecorded(new File(chunks, `voice-message.${extension}`, { type }));
      };
      recorder.current = instance;
      instance.start();
      setSeconds(0);
      setRecording(true);
      const startedAt = Date.now();
      timer.current = setInterval(() => {
        const elapsed = Math.min(120, Math.floor((Date.now() - startedAt) / 1000));
        if (mounted.current) setSeconds(elapsed);
        if (elapsed >= 120 && instance.state === 'recording') instance.stop();
      }, 1000);
    } catch (error) {
      release();
      if (mounted.current) reportError(error.message);
    } finally {
      startingRef.current = false;
      if (mounted.current) setStarting(false);
    }
  }
  function stop(cancel = false) {
    discarded.current = cancel;
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }
  return { recording, starting, seconds, start, stop };
}
