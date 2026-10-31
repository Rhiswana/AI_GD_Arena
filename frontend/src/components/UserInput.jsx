import { useState, useRef, useEffect } from 'react';

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function UserInput({ disabled, onSend, onInterrupt }) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState('');
  const recognition = useRef(null);
  useEffect(() => () => recognition.current?.abort(), []); // stop the mic on unmount

  function toggleMic() {
    if (!Recognition) { setNote('Speech recognition is not supported in this browser (Chrome or Edge work best). Please type instead.'); return; }
    if (listening) { recognition.current.stop(); return; }
    onInterrupt(); // stop AI speech before listening
    setNote('');
    const rec = new Recognition();
    rec.lang = 'en-US'; rec.interimResults = true;
    // Recognised words go into the box so the user can review and edit before sending.
    rec.onresult = (e) => setText(Array.from(e.results).map((r) => r[0].transcript).join(' '));
    rec.onerror = (e) => setNote(e.error === 'not-allowed' ? 'Microphone access was denied. You can still type your point.' : `Speech recognition error: ${e.error}`);
    rec.onend = () => setListening(false);
    recognition.current = rec; rec.start(); setListening(true);
  }

  function submit(e) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || disabled) return; // blocks empty and repeated submissions
    recognition.current?.abort(); setListening(false);
    onSend(clean); setText('');
  }

  return (
    <form className="card user-input" onSubmit={submit}>
      <input value={text} disabled={disabled} onChange={(e) => setText(e.target.value)}
        placeholder={disabled ? 'Preparation time: plan your points...' : 'Type your point, or use the microphone...'} />
      <button type="button" className={`mic ${listening ? 'on' : ''}`} onClick={toggleMic} disabled={disabled} aria-label="Microphone">🎤</button>
      <button type="button" onClick={onInterrupt}>⏹ Stop AI voice</button>
      <button className="primary" disabled={disabled || !text.trim()}>Send</button>
      {listening && <p className="listening">● Listening… speak now, then review and press Send.</p>}
      {note && <p className="error">{note}</p>}
    </form>
  );
}
