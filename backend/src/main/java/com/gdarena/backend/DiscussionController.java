package com.gdarena.backend;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/discussion")
public class DiscussionController {

    private static final Logger log = LoggerFactory.getLogger(DiscussionController.class);

    public record Line(String speaker, String role, String text) {}
    public record TurnRequest(String topic, List<Line> transcript) {}
    public record TurnResponse(String speaker, String role, String text) {}

    private static final List<String> PARTICIPANTS = List.of("Alex", "Maya");
    private static final Map<String, String> PERSONAS = Map.of(
            "Alex", "You are confident and assertive. You take a clear stand, give result-focused arguments, and politely challenge vague points.",
            "Maya", "You are analytical and thoughtful. You question assumptions, ask for evidence, and weigh short-term against long-term effects.");

    private final LlmClient llm;

    public DiscussionController(LlmClient llm) {
        this.llm = llm;
    }

    @PostMapping("/turn")
    public TurnResponse turn(@RequestBody TurnRequest req) {
        if (!llm.hasKey()) {
            throw new IllegalStateException("LLM_API_KEY is not set on the server.");
        }
        List<Line> all = (req.transcript() == null) ? List.of() : req.transcript();
        List<Line> recent = all.subList(Math.max(0, all.size() - 12), all.size()); // keeps the prompt small
        String topic = (req.topic() == null || req.topic().isBlank()) ? "a general topic" : req.topic();
        if (topic.length() > 200) topic = topic.substring(0, 200);

        String next = nextSpeaker(all);

        String system = """
                You are %s, one of the participants in a campus placement group discussion practice session. %s
                Rules:
                - Speak naturally, like a student in a real group discussion. Plain spoken English only.
                - Reply in 2 or 3 short sentences, at most 45 words in total.
                - Respond to the latest point. Add something new and do not repeat earlier points.
                - If the user just spoke, answer their point directly: agree, challenge or build on it.
                - You may address others by name, for example: I disagree with Maya.
                - Write numbers and years as words, never as digits. No lists, no markdown, no emojis, no stage directions.
                - Never say that you are an AI.
                - Output only the words you will say.
                """.formatted(next, PERSONAS.get(next));

        StringBuilder transcript = new StringBuilder();
        for (Line l : recent) {
            String who = "You".equals(l.speaker()) ? "User" : l.speaker();
            transcript.append(who).append(": ").append(l.text()).append("\n");
        }
        String user = "Topic: " + topic + "\n\nDiscussion so far:\n" + transcript
                + "\nIt is now " + next + "'s turn. Say your next contribution.";

        String text = clean(llm.chat(system, user));
        if (text.isBlank()) {
            throw new IllegalStateException("The AI returned an empty reply.");
        }
        log.info("LLM turn by {}: {}", next, text);
        return new TurnResponse(next, "ai", text);
    }

    /** The participant who did not speak last goes next. Alex starts. */
    private static String nextSpeaker(List<Line> lines) {
        for (int i = lines.size() - 1; i >= 0; i--) {
            String s = lines.get(i).speaker();
            if (PARTICIPANTS.contains(s)) {
                return s.equals("Alex") ? "Maya" : "Alex";
            }
        }
        return "Alex";
    }

    private static String clean(String t) {
        String s = t.replace("*", "").replace("#", "").replaceAll("\\s+", " ").trim();
        return s.replaceFirst("^(Alex|Maya)\\s*:\\s*", "");
    }
}