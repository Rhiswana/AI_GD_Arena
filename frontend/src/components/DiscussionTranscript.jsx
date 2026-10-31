import { useEffect, useRef } from 'react';

export default function DiscussionTranscript({ entries, autoScroll }) {
  const box = useRef(null);
  // Scroll only the transcript box (not the page) to the newest entry.
  useEffect(() => { if (autoScroll && box.current) box.current.scrollTop = box.current.scrollHeight; }, [entries.length, autoScroll]);
  return (
    <div className="transcript" ref={box}>
      {entries.length === 0 && <p className="muted">The transcript will appear here.</p>}
      {entries.map((e) => (
        <div key={e.id} className={`line ${e.role}`}><strong>{e.speaker}</strong><p>{e.text}</p></div>
      ))}
    </div>
  );
}
