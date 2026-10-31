package com.gdarena.backend;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Service
public class GnaniClient {

    private final RestClient http;
    private final String apiKey;
    private final String ttsModel;

    // Gnani allows 1 active request at a time, so all calls go through this gate one by one.
    private final Object gate = new Object();

    public GnaniClient(@Value("${gnani.api-key:}") String apiKey,
                       @Value("${gnani.base-url}") String baseUrl,
                       @Value("${gnani.tts.model}") String ttsModel) {
        this.apiKey = apiKey;
        this.ttsModel = ttsModel;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(60_000);
        this.http = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    public boolean hasKey() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Speech to text (Gnani Prisma). Returns the transcript. */
    public String transcribe(byte[] wav, String languageCode) {
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("audio_file", new ByteArrayResource(wav) {
            @Override
            public String getFilename() {
                return "speech.wav";
            }
        });
        form.add("language_code", languageCode);

        synchronized (gate) {
            Map<?, ?> body = http.post()
                    .uri("/stt/v3")
                    .header("X-API-Key-ID", apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(form)
                    .retrieve()
                    .body(Map.class);
            Object transcript = (body == null) ? null : body.get("transcript");
            return transcript == null ? "" : transcript.toString();
        }
    }

    /** Text to speech (Gnani Timbre). Returns an MP3 file as bytes. */
    public byte[] synthesize(String text, String voice, String language) {
        Map<String, Object> body = Map.<String, Object>of(
                "text", text,
                "voice", voice,
                "model", ttsModel,
                "language", language,
                "speed", 1.0,
                "audio_config", Map.<String, Object>of(
                        "sample_rate", 24000,
                        "num_channels", 1,
                        "sample_width", 2,
                        "container", "mp3",
                        "bitrate", "128k"));

        synchronized (gate) {
            return http.post()
                    .uri("/api/v1/tts/inference")
                    .header("X-API-Key-ID", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.ALL)
                    .body(body)
                    .retrieve()
                    .body(byte[].class);
        }
    }
}