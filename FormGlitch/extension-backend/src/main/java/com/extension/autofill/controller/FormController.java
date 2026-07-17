package com.extension.autofill.controller;

import com.extension.autofill.model.FillRequest;
import com.extension.autofill.model.FillResponse;
import com.extension.autofill.model.ParseRequest;
import com.extension.autofill.model.UpdateRequest;
import com.extension.autofill.service.LlmService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/autofill")
@CrossOrigin(origins = "*")
@Slf4j
public class FormController {

    private final LlmService llm;

    public FormController(LlmService llm) {
        this.llm = llm;
    }

    @PostMapping
    public ResponseEntity<?> autofill(@RequestBody FillRequest request) {
        log.info("Autofill requested. Model: {}", request.getModel());
        try {
            Map<String, String> answers = llm.generateAutofillAnswers(request);
            return ResponseEntity.ok(new FillResponse(answers));
        } catch (Exception e) {
            log.error("Autofill generation failed", e);
            return error(e.getMessage(), HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
    
    @PostMapping("/extract-profile")
    public ResponseEntity<?> extractProfile(@RequestBody ParseRequest request) {
        log.info("Profile extraction requested. Model: {}", request.getModel());
        try {
            String profileJson = llm.extractProfile(request);
            return ResponseEntity.ok(profileJson);
        } catch (Exception e) {
            log.error("Profile extraction failed", e);
            return error(e.getMessage(), HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    @PostMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateRequest request) {
        log.info("Profile update requested. Model: {}", request.getModel());
        try {
            String updatedJson = llm.updateProfile(request);
            return ResponseEntity.ok(updatedJson);
        } catch (Exception e) {
            log.error("Profile update failed", e);
            return error(e.getMessage(), HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private ResponseEntity<Map<String, String>> error(String message, HttpStatus status) {
        Map<String, String> body = new HashMap<>();
        body.put("error", message);
        return ResponseEntity.status(status).body(body);
    }
}
