import { useState, useRef, useEffect } from 'react';

const MAX_SECONDS = 28; // Gnani REST accepts up to 30 seconds

// Converts the recording (webm/mp4) into a 16 kHz mono WAV file, which Gnani accepts.
async function toWav(blob) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  ctx.close();

  const rate = 16000;
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * rate), rate);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const samples = (await offline.startRendering()).getChannelData(0);

  // Write a WAV header, then 16-bit samples.
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (pos, str) => { for (let i = 0; i < str.length; i++) view.setUint8(pos + i, str.charCodeAt(i)); };
  write(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); write(8, 'WAVE');
  write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  write(36, 'data'); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

export default function UserInput({ disabled, onSend, onInterrupt }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'recording' | 'processing'
  const [note, setNote] = useState('');
  const recorder = useRef(null);
  const chunks = useRef([]);
  const stream = useRef(null);
  const stopTimer = useRef(null);

  // Release the microphone if the user leaves this screen.
  useEffect(() => () => {
    clearTimeout(stopTimer.current);
    if (recorder.current && recorder.current.state !== 'inactive') { recorder.current.onstop = null; recorder.current.stop(); }
    stream.current?.getTracks().forEach((t) => t.stop());
  }, []);

 async function startRecording() {
    onInterrupt(); // stop the AI voice before listening
    setNote('');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn('Mic error:', err.name, err.message);
      setNote(
        err.name === 'NotAllowedError' ? 'Microphone is blocked. Click the lock icon in the address bar, allow Microphone, then reload the page.' :
        err.name === 'NotFoundError' ? 'No microphone was found on this device.' :
        `Microphone error: ${err.name}. Open the app in a normal Chrome tab.`
      );
      return;
    }
    chunks.current = [];
    const rec = new MediaRecorder(stream.current);
    console.log('Recording started, format:', rec.mimeType);
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
    rec.onstop = handleStopped;
    recorder.current = rec;
    rec.start();
    setStatus('recording');
    stopTimer.current = setTimeout(stopRecording, MAX_SECONDS * 1000);
  }


  function stopRecording() {
    clearTimeout(stopTimer.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }

 async function handleStopped() {
    stream.current?.getTracks().forEach((t) => t.stop()); // turns the mic light off
    setStatus('processing');
    try {
      console.log('Chunks captured:', chunks.current.length);
      if (!chunks.current.length) { setNote('No audio was captured. Check that the right microphone is selected, then try again.'); return; }

      let wav;
      try {
        const raw = new Blob(chunks.current, { type: recorder.current.mimeType });
        wav = await toWav(raw);
      } catch (err) {
        console.warn('Audio conversion failed:', err);
        setNote('The recording could not be processed. Try again with a longer sentence.');
        return;
      }
      console.log(`Recorded ${(wav.size / 1024).toFixed(0)} KB of WAV audio`);

      const form = new FormData();
      form.append('audio', wav, 'speech.wav');
      form.append('language', 'en-IN');
      const res = await fetch('/api/stt', { method: 'POST', body: form });
      if (!res.ok) throw new Error(`status ${res.status}`);

      const data = await res.json(); // expected: { "text": "..." }
      if (data.text) setText((old) => (old ? old + ' ' : '') + data.text);
      else setNote('Could not hear anything. Please try again, or type.');
    } catch (err) {
      console.warn('Gnani STT failed:', err.message);
      setNote('Speech was recorded, but the speech-to-text service is not connected yet. Please type your point.');
    } finally {
      setStatus('idle');
    }
  }

  function toggleMic() {
    if (status === 'recording') stopRecording();
    else if (status === 'idle') startRecording();
  }

  function submit(e) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || disabled || status !== 'idle') return; // blocks empty and repeated submissions
    onSend(clean); setText('');
  }

  return (
    <form className="card user-input" onSubmit={submit}>
      <input value={text} disabled={disabled} onChange={(e) => setText(e.target.value)}
        placeholder={disabled ? 'Preparation time: plan your points...' : 'Type your point, or use the microphone...'} />
      <button type="button" className={`mic ${status === 'recording' ? 'on' : ''}`} onClick={toggleMic}
        disabled={disabled || status === 'processing'} aria-label="Microphone">🎤</button>
      <button type="button" onClick={onInterrupt}>⏹ Stop AI voice</button>
      <button className="primary" disabled={disabled || status !== 'idle' || !text.trim()}>Send</button>
      {status === 'recording' && <p className="listening">● Recording… press the mic again to stop.</p>}
      {status === 'processing' && <p className="listening">Converting your speech to text…</p>}
      {note && <p className="error">{note}</p>}
    </form>
  );
}