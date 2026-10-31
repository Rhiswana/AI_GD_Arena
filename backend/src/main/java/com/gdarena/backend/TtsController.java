package com.gdarena.backend;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TtsController {

    private static final Logger log = LoggerFactory.getLogger(TtsController.class);

    public record TtsRequest(String text, String speaker, String language) {}

    private final GnaniClient gnani;
    private final Environment env;
    // Remembers audio we already paid for, so repeating the same line costs no credits.
    private final Map<String, byte[]> cache = new ConcurrentHashMap<>();

    public TtsController(GnaniClient gnani, Environment env) {
        this.gnani = gnani;
        this.env = env;
    }

    @PostMapping("/tts")
    public ResponseEntity<byte[]> tts(@RequestBody TtsRequest req) {
        if (!gnani.hasKey()) {
            throw new IllegalStateException("GNANI_API_KEY is not set on the server.");
        }
        if (req.text() == null || req.text().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String speaker = (req.speaker() == null) ? "" : req.speaker().toLowerCase();
        String voice = env.getProperty("gnani.tts.voice." + speaker, env.getProperty("gnani.tts.voice.default"));
        String language = (req.language() == null || req.language().isBlank()) ? "en-IN" : req.language();

        String key = voice + "|" + language + "|" + req.text();
        byte[] audio = cache.get(key);
        if (audio == null) {
            log.info("TTS request: {} characters, voice {}", req.text().length(), voice);
            audio = gnani.synthesize(req.text(), voice, language);
            if (audio != null && cache.size() < 100) cache.put(key, audio);
        } else {
            log.info("TTS served from cache (no credits used)");
        }
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("audio/mpeg")).body(audio);
    }
}