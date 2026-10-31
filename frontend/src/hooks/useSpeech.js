import { useState, useEffect, useRef, useCallback } from 'react';

// Wraps the browser SpeechSynthesis API. If it is missing, speak() just waits a "reading time" so the demo still works.
export function useSpeechSynthesis() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState([]);
  const voicesRef = useRef([]);
  const token = useRef(0); // changes whenever speech is cancelled, so stale "onEnd" callbacks are ignored
  const timer = useRef(null);

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
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  const speak = useCallback((text, { voiceURI, rate, pitch, muted }, onEnd) => {
    cancel();
    const id = token.current;
    const done = () => { if (token.current === id) { token.current += 1; onEnd(); } };
    if (!supported || muted) { timer.current = setTimeout(done, Math.max(1500, text.length * 45)); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voicesRef.current.find((v) => v.voiceURI === voiceURI);
    if (voice) utterance.voice = voice; // otherwise the browser default is used
    utterance.rate = rate; utterance.pitch = pitch;
    utterance.onend = done; utterance.onerror = done;
    window.speechSynthesis.speak(utterance);
  }, [supported, cancel]);

  return { supported, voices, speak, cancel };
}
