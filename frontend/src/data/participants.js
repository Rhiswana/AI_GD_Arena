// Personas and mock lines. {topic}, {prev} (previous speaker) and {quote} (the user's words) are filled in by mockEngine.js.
export const MODERATOR = { id: 'moderator', name: 'Moderator', role: 'Neutral · Organised', initials: 'MO', color: '#7c8cff' };
export const USER = { id: 'user', name: 'You', role: 'Participant', initials: 'YOU', color: '#22c55e' };

export const CANDIDATES = [
  { id: 'alex', name: 'Alex', role: 'Confident · Assertive', initials: 'AL', color: '#f97316',
    points: [
      "Let me be direct: on '{topic}', I think the answer comes down to results. Recruiters pick people who take ownership and deliver, so I'll take a clear stand.",
      "A clear position beats a vague middle ground. In a startup, one decisive person who commits to a plan often moves the whole team faster than ten people debating.",
      "We should stop saying 'it depends' and name what matters most. For me, it's accountability."],
    replies: [
      "I'll have to disagree with {prev} here. Good intentions are fine, but without someone driving the decision, nothing gets done.",
      "{prev} makes a fair point, but it's incomplete. Who takes responsibility when things go wrong?"],
    toUser: [
      "{quote} I see where you're going, but back it with a concrete example. Otherwise it stays an opinion.",
      "{quote} That's a decent start. What is the actual outcome if we follow your logic?"] },
  { id: 'maya', name: 'Maya', role: 'Analytical · Thoughtful', initials: 'MA', color: '#a78bfa',
    points: [
      "I'd like to look at the assumptions behind '{topic}'. Are we comparing two things that really compete, or are they connected? Let's define the terms first.",
      "There are short-term and long-term effects here. In the short term one factor may dominate, but over time the other compounds. We should weigh both.",
      "We haven't tested the counter-case: when does the opposite view hold true? Strong arguments survive that question."],
    replies: [
      "{prev}, I see the claim, but what evidence supports it? One example doesn't prove a general rule.",
      "Building on {prev}'s point, I'd challenge one thing: are we confusing correlation with cause?"],
    toUser: [
      "{quote} Interesting angle. Can you explain the reasoning step by step? I'd like to see how it holds against the opposing view.",
      "{quote} I partly agree, but have you considered the trade-offs? Every approach has a cost."] },
  { id: 'ryan', name: 'Ryan', role: 'Fact-focused · Practical', initials: 'RY', color: '#38bdf8',
    points: [
      "Let me bring a practical example to '{topic}'. Look at how a hospital ward or a cricket team works day to day; real results come from how the pieces combine in practice.",
      "Workplace studies often show that outcomes improve when roles are clear. Project teams in IT companies show this every day.",
      "A concrete case: in college projects, groups that split tasks early finished faster and scored better. Most of us have seen that."],
    replies: [
      "{prev} raised a good theory, but let me ground it with an example. In most companies, what works is a simple, tested process.",
      "To add to {prev}'s argument, practical evidence matters. Without numbers or cases, we're only speculating."],
    toUser: [
      "{quote} Good point. Do you have a real example, maybe from a project or internship? That would make it stronger.",
      "{quote} That's useful in practice. I'd add that real teams' results back this up, at least partly."] },
  { id: 'priya', name: 'Priya', role: 'Expressive · Collaborative', initials: 'PR', color: '#f472b6',
    points: [
      "I think '{topic}' is something we can explore together. There's truth on more than one side, so let's look for common ground.",
      "Personally, I've seen listening to different views lead to better decisions. A balanced approach can include everyone's strengths.",
      "Let's not forget the human side. People perform better when they feel heard, and that matters in every field."],
    replies: [
      "I like what {prev} said, though I'd soften it a little. Maybe both views can work together instead of competing.",
      "{prev} has a strong point, and collaboration makes ideas stronger. Can we combine the best of both sides?"],
    toUser: [
      "{quote} Thank you for sharing that! It adds a fresh angle and connects well with what we've discussed.",
      "{quote} I really like that point. It shows why listening to each other matters."] },
];
