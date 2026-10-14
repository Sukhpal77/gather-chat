'use client';
import { useEffect, useRef, useState } from 'react';

export function useVoiceRecorder(onRecorded, reportError) {
  const recorder = useRef(null);
  const stream = useRef(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timer = useRef(null);
  const discarded = useRef(false);
  function release() {
    stream.current?.getTracks().forEach((track) => track.stop());
    clearInterval(timer.current);
  }
  useEffect(
    () => () => {
      discarded.current = true;
      if (recorder.current?.state === 'recording') recorder.current.stop();
      release();
    },
    [],
  );
  async function start() {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
        throw new Error('Voice recording needs HTTPS or localhost and a supported browser.');
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        setRecording(false);
        if (discarded.current) return;
        const type = (instance.mimeType || 'audio/webm').split(';')[0];
        const extension = type === 'audio/mp4' ? 'm4a' : type === 'audio/ogg' ? 'ogg' : 'webm';
        onRecorded(new File(chunks, `voice-message.${extension}`, { type }));
      };
      recorder.current = instance;
      instance.start();
      setSeconds(0);
      setRecording(true);
      timer.current = setInterval(
        () =>
          setSeconds((value) => {
            if (value >= 119) instance.stop();
            return value + 1;
          }),
        1000,
      );
    } catch (error) {
      release();
      reportError(error.message);
    }
  }
  function stop(cancel = false) {
    discarded.current = cancel;
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }
  return { recording, seconds, start, stop };
}
