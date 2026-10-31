import { useState } from 'react';
import Header from './components/Header';
import TopicSetup from './components/TopicSetup';
import DiscussionRoom from './components/DiscussionRoom';
import FinalReport from './components/FinalReport';
import './styles.css';

// App only decides which screen to show. The discussion logic lives in DiscussionRoom.
export default function App() {
  const [screen, setScreen] = useState('setup'); // 'setup' | 'room' | 'report'
  const [config, setConfig] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [phase, setPhase] = useState('prep');
  const [showSettings, setShowSettings] = useState(false);
  const [blankTopic, setBlankTopic] = useState(false);

  const status =
    screen === 'setup' ? 'Ready' :
    screen === 'report' ? 'Discussion Completed' :
    phase === 'prep' ? 'Preparing' : 'Discussion in Progress';

  const start = (cfg) => { setConfig(cfg); setPhase('prep'); setScreen('room'); };
  const finish = (entries) => { setTranscript(entries); setScreen('report'); };
  const goSetup = (blank) => { setBlankTopic(blank); setScreen('setup'); };

  return (
    <div className="app">
      <Header status={status} onSettings={() => setShowSettings((s) => !s)} />
      {screen === 'setup' && <TopicSetup key={String(blankTopic)} blank={blankTopic} onStart={start} />}
      {screen === 'room' && (
        <DiscussionRoom config={config} showSettings={showSettings} onPhase={setPhase} onFinish={finish} />
      )}
      {screen === 'report' && (
        <FinalReport transcript={transcript} topic={config.topic}
          onAnother={() => goSetup(true)} onHome={() => goSetup(false)} />
      )}
    </div>
  );
}
