package com.gdarena.backend;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final GnaniClient gnani;

    public HealthController(GnaniClient gnani) {
        this.gnani = gnani;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "gnaniKey", gnani.hasKey() ? "configured" : "missing");
    }
}