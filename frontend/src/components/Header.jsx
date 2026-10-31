export default function Header({ status, onSettings }) {
  return (
    <header className="header">
      <div><h1>GD Arena</h1><p>AI Group Discussion Practice</p></div>
      <div className="header-right">
        <span className="status"><i className="dot" />{status}</span>
        <button className="icon-btn" onClick={onSettings} aria-label="Voice settings" title="Voice settings">⚙</button>
      </div>
    </header>
  );
}
