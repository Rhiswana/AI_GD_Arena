package com.gdarena.backend;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientResponseException;

@RestControllerAdvice
public class ApiErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiErrorHandler.class);

    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<Map<String, String>> gnaniError(RestClientResponseException e) {
        int status = e.getStatusCode().value();
        log.error("Gnani returned {}: {}", status, e.getResponseBodyAsString());
               String message = switch (status) {
            case 401, 403 -> "The API key was rejected (" + status + "). Check the key and its permissions.";
            case 402 -> "Credits are finished for this API.";
            case 429 -> "Too many requests or the quota is used up (429). Wait a moment, or try another model.";
            default -> "An AI service returned an error (" + status + ").";
        };
        return ResponseEntity.status(502).body(Map.of("error", message));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> notConfigured(IllegalStateException e) {
        log.error(e.getMessage());
        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
}