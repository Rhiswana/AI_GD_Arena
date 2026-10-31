import { useState } from 'react';
import { buildReport } from '../utils/report';
import DiscussionTranscript from './DiscussionTranscript';

export default function FinalReport({ transcript, topic, onAnother, onHome }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const report = buildReport(transcript, topic);
  return (
    <main className="card report">
      <h2>Your GD Report</h2>
      <p className="notice">Basic demo evaluation based only on the text transcript. It cannot measure spoken confidence, pronunciation or vocal delivery.</p>
      <div className="score">{report.overall}<span>/10</span></div>
      <div className="grid">
        {report.sections.map((s) => (
          <div key={s.name} className="card"><strong>{s.name}</strong>
            <div className="big">{s.value ?? `${s.score}/10`}</div><p className="muted small">{s.note}</p></div>
        ))}
      </div>
      <h3>Three improvement suggestions</h3><ol>{report.suggestions.map((t) => <li key={t}>{t}</li>)}</ol>
      <h3>Three points you could have added</h3><ol>{report.examples.map((t) => <li key={t}>{t}</li>)}</ol>
      <div className="controls">
        <button onClick={() => setShowTranscript(!showTranscript)}>{showTranscript ? 'Hide transcript' : 'Review transcript'}</button>
        <button className="primary" onClick={onAnother}>Practise another topic</button>
        <button onClick={onHome}>Return to home</button>
      </div>
      {showTranscript && <DiscussionTranscript entries={transcript} />}
    </main>
  );
}
