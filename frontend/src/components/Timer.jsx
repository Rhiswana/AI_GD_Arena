export default function Timer({ seconds, label }) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return <div className="timer"><span className="muted">{label}</span><strong>{m}:{s}</strong></div>;
}
