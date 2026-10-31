package com.gdarena.backend;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/** Talks to any chat model that uses the OpenAI-style chat format (Gemini today, Evon later). */
@Service
public class LlmClient {

    private final RestClient http;
    private final String apiKey;
    private final String model;

    public LlmClient(@Value("${llm.api-key:}") String apiKey,
                     @Value("${llm.base-url}") String baseUrl,
                     @Value("${llm.model}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(60_000);
        this.http = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    public boolean hasKey() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String chat(String system, String user) {
        Map<String, Object> body = Map.<String, Object>of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", system),
                        Map.of("role", "user", "content", user)),
                "temperature", 0.8,
                // Generous on purpose: Gemini's hidden "thinking" also uses these tokens.
                // Short replies are controlled by the prompt, not by this limit.
                "max_tokens", 1024);

        Map<?, ?> res = http.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

        try {
            Map<?, ?> first = (Map<?, ?>) ((List<?>) res.get("choices")).get(0);
            Object content = ((Map<?, ?>) first.get("message")).get("content");
            return content == null ? "" : content.toString().trim();
        } catch (RuntimeException e) {
            throw new IllegalStateException("The AI returned an answer in an unexpected format.");
        }
    }
}