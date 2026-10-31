export default function ParticipantCard({ person, speaking, voices, voiceURI, onVoiceChange }) {
  return (
    <div className={`card participant ${speaking ? 'speaking' : 'idle'}`}>
      <div className="avatar" style={{ background: person.color }}>{person.initials}</div>
      <div><strong>{person.name}</strong><div className="muted small">{person.role}</div>
        <div className="small">{speaking ? '🔊 Speaking…' : 'Idle'}</div></div>
      {onVoiceChange && voices.length > 0 && (
        <select className="voice-select" aria-label={`Voice for ${person.name}`} value={voiceURI || ''} onChange={(e) => onVoiceChange(person.name, e.target.value)}>
          {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
        </select>
      )}
    </div>
  );
}
