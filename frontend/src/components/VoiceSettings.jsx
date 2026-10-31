export default function VoiceSettings({ supported, options, onChange }) {
  if (!supported) return <div className="card settings">Voice playback is not supported in this browser. Text transcript still works.</div>;
  const set = (key, value) => onChange({ ...options, [key]: value });
  return (
    <div className="card settings">
      <label>Speech rate: {options.rate.toFixed(1)}
        <input type="range" min="0.6" max="1.6" step="0.1" value={options.rate} onChange={(e) => set('rate', Number(e.target.value))} /></label>
      <label>Pitch: {options.pitch.toFixed(1)}
        <input type="range" min="0.5" max="1.5" step="0.1" value={options.pitch} onChange={(e) => set('pitch', Number(e.target.value))} /></label>
      <p className="muted small">Pick each participant's voice from the drop-down on their card.</p>
    </div>
  );
}
