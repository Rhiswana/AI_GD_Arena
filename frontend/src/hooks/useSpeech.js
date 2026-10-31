import { useState, useEffect, useRef, useCallback } from 'react';

// Speaks a line using Gnani Timbre through OUR backend (/api/tts).
// If the backend is not ready or fails, it falls back to the browser voice,
// so the app always keeps working.
export function useSpeechSynthesis() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState([]);
  const voicesRef = useRef([]);
  const token = useRef(0);      // changes whenever speech is cancelled, so stale callbacks are ignored
  const timer = useRef(null);
  const audioRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
      voicesRef.current = list;
      setVoices(list);
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => { window.speechSynthesis.removeEventListener('voiceschanged', load); window.speechSynthesis.cancel(); };
  }, [supported]);

  const cancel = useCallback(() => {
    token.current += 1;
    clearTimeout(timer.current);
    abortRef.current?.abort();            // stop a request that is still loading
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  // Browser voice: used only as a backup.
  const speakWithBrowser = useCallback((text, voiceURI, rate, pitch, done) => {
    if (!supported) { timer.current = setTimeout(done, Math.max(1500, text.length * 45)); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voicesRef.current.find((v) => v.voiceURI === voiceURI);
    if (voice) utterance.voice = voice;
    utterance.rate = rate; utterance.pitch = pitch;
    utterance.onend = done; utterance.onerror = done;
    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const speak = useCallback(async (text, { voiceURI, rate, pitch, muted, speaker }, onEnd) => {
    cancel();
    const id = token.current;
    const done = () => { if (token.current === id) { token.current += 1; onEnd(); } };

    // Muted: do not call the API at all, so no credits are used.
    if (muted) { timer.current = setTimeout(done, Math.max(1500, text.length * 45)); return; }

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker }),   // the backend picks the voice from the speaker name
        signal: controller.signal,
      });
      const type = res.headers.get('content-type') || '';
      if (!res.ok || !type.includes('audio')) throw new Error(`TTS failed (status ${res.status})`);
      const blob = await res.blob();
      if (token.current !== id) return;            // cancelled while loading

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.playbackRate = rate || 1;
      audio.onended = () => { URL.revokeObjectURL(url); done(); };
      audio.onerror = () => { URL.revokeObjectURL(url); done(); };
      audioRef.current = audio;
      await audio.play();
    } catch (err) {
      if (err.name === 'AbortError' || token.current !== id) return; // cancelled on purpose
      console.warn('Gnani TTS not available, using browser voice instead:', err.message);
      speakWithBrowser(text, voiceURI, rate, pitch, done);
    }
  }, [cancel, speakWithBrowser]);

  return { supported, voices, speak, cancel };
}