package com.gdarena.backend;

import java.io.IOException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class SttController {

    private static final Logger log = LoggerFactory.getLogger(SttController.class);
    private final GnaniClient gnani;

    public SttController(GnaniClient gnani) {
        this.gnani = gnani;
    }

    @PostMapping("/stt")
    public Map<String, String> stt(@RequestParam("audio") MultipartFile audio,
                                   @RequestParam(value = "language", defaultValue = "en-IN") String language)
            throws IOException {
        if (!gnani.hasKey()) {
            throw new IllegalStateException("GNANI_API_KEY is not set on the server.");
        }
        log.info("STT request: {} KB, language {}", audio.getSize() / 1024, language);
        String text = gnani.transcribe(audio.getBytes(), language);
        log.info("STT result: \"{}\"", text);
        return Map.of("text", text);
    }
}