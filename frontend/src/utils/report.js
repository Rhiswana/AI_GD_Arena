// Basic transcript-only scoring using simple word counts. It cannot judge voice, confidence or pronunciation.
const words = (t) => t.toLowerCase().match(/[a-z']{4,}/g) || [];
const clamp = (n) => Math.max(0, Math.min(10, Math.round(n)));

export function buildReport(transcript, topic) {
  const mine = transcript.filter((e) => e.role === 'user');
  const count = mine.length;
  const topicWords = new Set(words(topic));
  const aiWords = new Set(transcript.filter((e) => e.role !== 'user').flatMap((e) => words(e.text)));
  const allMine = mine.flatMap((e) => words(e.text));
  const avgLength = count ? mine.reduce((s, e) => s + e.text.split(/\s+/).length, 0) / count : 0;

  const share = (test) => (count ? mine.filter(test).length / count : 0);
  const relevant = share((m) => words(m.text).some((w) => topicWords.has(w) || aiWords.has(w)));
  const listening = share((m) => {
    const at = transcript.indexOf(m);
    const prevWords = new Set(transcript.slice(Math.max(0, at - 2), at).flatMap((e) => words(e.text)));
    return words(m.text).some((w) => prevWords.has(w));
  });
  const rude = mine.filter((m) => /stupid|idiot|shut up|dumb|nonsense/i.test(m.text)).length;
  const unique = allMine.length ? new Set(allMine).size / allMine.length : 0;
  const duplicates = count - new Set(mine.map((m) => m.text.toLowerCase())).size;

  const sections = [
    { name: 'Number of contributions', value: String(count), note: count < 3 ? 'Aim for at least 3 to 4 points in a GD.' : 'Good participation level.' },
    { name: 'Relevance of contributions', score: clamp(relevant * 10), note: 'Checks if your points reuse topic or discussion words.' },
    { name: 'Clarity of arguments', score: !count ? 0 : avgLength >= 15 && avgLength <= 45 ? 9 : avgLength >= 8 && avgLength <= 70 ? 6 : 4, note: `Average length: ${Math.round(avgLength)} words per point.` },
    { name: 'Initiative and participation', score: clamp(count * 2.5), note: 'Based on how many times you contributed.' },
    { name: 'Listening and responding', score: clamp(listening * 10), note: 'Checks if you picked up words from the previous speakers.' },
    { name: 'Professional behaviour', score: count ? clamp(10 - rude * 4) : 0, note: rude ? 'Avoid dismissive language.' : 'No rude wording detected.' },
    { name: 'Repetition', score: count ? clamp(Math.min(10, unique * 12) - duplicates * 3) : 0, note: 'Higher means fewer repeated words and points.' },
  ];
  const scored = sections.filter((s) => s.score !== undefined);
  const overall = Math.round((scored.reduce((s, x) => s + x.score, 0) / scored.length) * 10) / 10;

  const suggestions = [];
  if (count < 3) suggestions.push('Contribute more often. Do not wait to be invited.');
  if (avgLength < 15) suggestions.push('Structure points as claim, reason, example.');
  if (listening < 0.5) suggestions.push("Refer to a speaker by name, e.g. 'I agree with Maya, but...'.");
  suggestions.push('Open with a clear stance in one sentence.', 'Support each point with a real example or number.', 'Summarise the discussion in the last minute.');
  const examples = [
    `One strong point on "${topic}" is that real outcomes depend on how people combine skills, not only on skill alone.`,
    'A counter-argument to consider: the opposing view works in the short term but has costs over time.',
    'An example from a college project or internship would show practical experience.',
  ];
  return { overall, sections, suggestions: suggestions.slice(0, 3), examples };
}
