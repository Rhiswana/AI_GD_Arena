import { useState, useEffect, useRef, useCallback } from 'react';
import { MODERATOR, CANDIDATES, USER } from '../data/participants';
import { nextAiTurn, moderatorLine } from '../utils/mockEngine';
import { useSpeechSynthesis } from '../hooks/useSpeech';
import ParticipantCard from './ParticipantCard';
import DiscussionTranscript from './DiscussionTranscript';
import UserInput from './UserInput';
import Timer from './Timer';
import VoiceSettings from './VoiceSettings';

// Only 2 AI participants in version 1, to save API credits.
const ACTIVE = CANDIDATES.slice(0, 2);

export default function DiscussionRoom({ config, showSettings, onPhase, onFinish }) {
  const { topic, durationMin, prepSeconds } = config;
  const [phase, setPhase] = useState('prep'); // 'prep' | 'discussion'
  const [secondsLeft, setSecondsLeft] = useState(prepSeconds);
  const [paused, setPaused] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [speaker, setSpeaker] = useState(null);
  const [thinking, setThinking] = useState(false); // true while waiting for the AI reply
  const [voiceMap, setVoiceMap] = useState({});
  const [voiceOptions, setVoiceOptions] = useState({ rate: 1, pitch: 1, muted: false });
  const { supported, voices, speak, cancel } = useSpeechSynthesis();

  // Refs hold the latest values so timers and callbacks never read stale state.
  const transcriptRef = useRef([]);
  const settingsRef = useRef({});
  const phaseRef = useRef('prep');
  const finishedRef = useRef(false);
  const pausedRef = useRef(false);
  settingsRef.current = { voiceMap, ...voiceOptions };
  pausedRef.current = paused;

  const addEntry = useCallback((name, role, text) => {
    const entry = { id: transcriptRef.current.length + 1, speaker: name, role, text };
    transcriptRef.current = [...transcriptRef.current, entry];
    setTranscript(transcriptRef.current);
  }, []);

  // Add a line to the transcript and read it aloud.
  const say = useCallback((name, role, text) => {
    addEntry(name, role, text);
    setSpeaker(name);
    const s = settingsRef.current;
   // speak(text, { voiceURI: s.voiceMap[name], rate: s.rate, pitch: s.pitch, muted: s.muted }, () => setSpeaker(null));
   speak(text, { voiceURI: s.voiceMap[name], rate: s.rate, pitch: s.pitch, muted: s.muted, speaker: name }, () => setSpeaker(null));
  }, [addEntry, speak]);

  // Give each AI participant a different default voice once voices have loaded.
  useEffect(() => {
    if (!voices.length) return;
    setVoiceMap((old) => {
      const next = { ...old };
      [MODERATOR, ...ACTIVE].forEach((p, i) => { if (!next[p.name]) next[p.name] = voices[i % voices.length].voiceURI; });
      return next;
    });
  }, [voices]);

  // Stage A: moderator announces the topic. Stop speech when leaving.
  useEffect(() => {
    say('Moderator', 'moderator', moderatorLine('prep', topic, prepSeconds));
    return () => cancel();
  }, []); // eslint-disable-line

  const startDiscussion = useCallback(() => {
    if (phaseRef.current !== 'prep') return; // prevents starting twice
    phaseRef.current = 'discussion';
    setPhase('discussion'); onPhase('discussion');
    setSecondsLeft(durationMin * 60);
    say('Moderator', 'moderator', moderatorLine('intro', topic));
  }, [durationMin, topic, say, onPhase]);

  const endDiscussion = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    cancel();
    onFinish(transcriptRef.current);
  }, [cancel, onFinish]);

  // One countdown interval at a time; it is cleared when paused or when the phase changes.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [paused, phase]);

  useEffect(() => {
    if (secondsLeft > 0) return;
    if (phaseRef.current === 'prep') startDiscussion();
    else { addEntry('Moderator', 'moderator', moderatorLine('close', topic)); endDiscussion(); }
  }, [secondsLeft]); // eslint-disable-line

  // Stage B turn manager: when nobody is speaking or thinking, wait 2 seconds, then ask for the next AI turn.
  // It re-runs after every new transcript entry, so a user message always gets a reply.
   useEffect(() => {
    if (phase !== 'discussion' || paused || speaker || thinking) return;
    const id = setTimeout(async () => {
      setThinking(true);
      const before = transcriptRef.current.length;
      console.log('[turn] asking AI, transcript lines:', before);
      try {
        const turn = await nextAiTurn(topic, transcriptRef.current);
        // Skip this reply if the user spoke meanwhile, the GD was paused, or it ended.
        if (transcriptRef.current.length === before && !pausedRef.current && !finishedRef.current) {
          console.log('[turn] speaking:', turn.speaker);
          say(turn.speaker, turn.role, turn.text);
        } else {
          console.log('[turn] reply thrown away (you spoke, paused or ended meanwhile)');
        }
      } catch (err) {
        console.warn('[turn] failed:', err);
      } finally {
        setThinking(false);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [phase, paused, speaker, thinking, transcript.length, topic, say]);
  function stopAiVoice() { cancel(); setSpeaker(null); }

  function handleSend(text) {
    stopAiVoice(); // the user interrupts the AI
    addEntry('You', 'user', text);
  }

  function togglePause() {
    if (!paused) stopAiVoice();
    setPaused(!paused);
  }

  const card = (p) => (
    <ParticipantCard key={p.id} person={p} speaking={speaker === p.name} voices={voices}
      voiceURI={voiceMap[p.name]} onVoiceChange={(name, uri) => setVoiceMap({ ...voiceMap, [name]: uri })} />
  );
 
  return (
    <div className="room">
      <div className="side">{[MODERATOR, ACTIVE[0]].map(card)}</div>
      <section className="card panel">
        <p className="muted small">Topic</p><h3>{topic}</h3>
        <Timer seconds={secondsLeft} label={phase === 'prep' ? 'Preparation time' : 'Discussion time left'} />
        <p>Current speaker: <strong>{paused ? 'Paused' : speaker || (thinking ? 'Thinking…' : '-')}</strong></p>
        <div className="controls">
          <button onClick={togglePause}>{paused ? '▶ Resume' : '⏸ Pause'}</button>
          <button onClick={() => setVoiceOptions({ ...voiceOptions, muted: !voiceOptions.muted })}>{voiceOptions.muted ? '🔇 Unmute' : '🔊 Mute'}</button>
          {phase === 'prep' && <button onClick={startDiscussion}>Skip preparation</button>}
          <button className="danger" onClick={endDiscussion}>End GD</button>
        </div>
        {showSettings && <VoiceSettings supported={supported} options={voiceOptions} onChange={setVoiceOptions} />}
        <DiscussionTranscript entries={transcript} autoScroll />
      </section>
      <div className="side">{[ACTIVE[1]].map(card)}
        <ParticipantCard person={USER} speaking={false} voices={[]} /></div>
      <UserInput disabled={phase === 'prep' || paused} onSend={handleSend} onInterrupt={stopAiVoice} />
    </div>
  );
}