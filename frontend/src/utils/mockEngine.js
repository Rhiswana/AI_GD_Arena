import { CANDIDATES } from '../data/participants';

const pick = (list, n) => list[n % list.length];
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');

// Moderator lines. kind: 'prep' | 'intro' | 'invite' | 'close'
export function moderatorLine(kind, topic, extra = 0) {
  if (kind === 'prep') {
    const time = extra >= 60 ? `${Math.round(extra / 60)} minutes` : `${extra} seconds`;
    return `Welcome to the group discussion. Today's topic is: ${topic}. You have ${time} to prepare. Think about your opening point, one example and one counter-argument.`;
  }
  if (kind === 'intro') return `Time is up for preparation. Let's begin. The topic is: ${topic}. Please be concise, listen to each other and build on earlier points. Who would like to start?`;
  if (kind === 'close') return 'Thank you all. That brings us to the end of the discussion time.';
  return pick([
    "Let me pause for a moment. We've heard a few views. Would you like to add a point?",
    "To summarise, there are views on both sides. Anyone who hasn't spoken yet is welcome to contribute, including you.",
    "A reminder to keep points short and build on what others said. We'd love to hear from you too."], extra);
}

// Turn manager: decides who speaks next and what they say. Fully deterministic, no real AI.
export function nextAiTurn(topic, transcript) {
  const last = transcript[transcript.length - 1];
  const aiTurns = transcript.filter((e) => e.role === 'ai').length;

  // Every 5th candidate turn the moderator steps in once.
  if (aiTurns > 0 && aiTurns % 5 === 0 && last.role === 'ai') {
    return { speaker: 'Moderator', role: 'moderator', text: moderatorLine('invite', topic, aiTurns / 5) };
  }
  const candidate = CANDIDATES[aiTurns % CANDIDATES.length];
  const timesSpoken = transcript.filter((e) => e.speaker === candidate.name).length;
  let line;

  if (last?.role === 'user') {
    // Reply to the user's actual words by quoting the start of their message.
    const words = last.text.split(/\s+/);
    const quote = `You said "${words.slice(0, 12).join(' ')}${words.length > 12 ? '…' : ''}".`;
    line = fill(pick(candidate.toUser, timesSpoken), { quote });
  } else if (last?.role === 'ai' && last.speaker !== candidate.name && timesSpoken > 0) {
    line = fill(pick(candidate.replies, timesSpoken), { prev: last.speaker });
  } else {
    line = fill(pick(candidate.points, timesSpoken), { topic });
  }
  return { speaker: candidate.name, role: 'ai', text: line };
}
