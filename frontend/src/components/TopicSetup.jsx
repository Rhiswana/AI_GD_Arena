import { useState } from 'react';

export default function TopicSetup({ blank, onStart }) {
  const [topic, setTopic] = useState(blank ? '' : 'Is teamwork more important than individual talent?');
  const [duration, setDuration] = useState(10);
  const [quickPrep, setQuickPrep] = useState(false);
  const [error, setError] = useState('');

  function handleStart() {
    const clean = topic.trim();
    if (clean.length < 5) { setError('Please enter a topic of at least 5 characters.'); return; }
    onStart({ topic: clean, durationMin: duration, prepSeconds: quickPrep ? 10 : 120 });
  }

  return (
    <main className="card setup">
      <h2>Practise Like It's a Real Interview</h2>
      <label htmlFor="topic">Enter your GD topic</label>
      <textarea id="topic" rows={3} value={topic} onChange={(e) => { setTopic(e.target.value); setError(''); }} />
      {error && <p className="error">{error}</p>}
      <label htmlFor="duration">Discussion duration</label>
      <select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
        {[5, 10, 20, 30].map((m) => <option key={m} value={m}>{m} minutes</option>)}
      </select>
      <label className="check"><input type="checkbox" checked={quickPrep} onChange={(e) => setQuickPrep(e.target.checked)} />
        Demo mode: 10 second preparation (normal is 2 minutes)</label>
      <button className="primary" onClick={handleStart}>Start GD</button>
      <p className="muted">Five AI participants (a moderator and four candidates) will join. Responses are scripted demo responses, not a real AI model.</p>
    </main>
  );
}
