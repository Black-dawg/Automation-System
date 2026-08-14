package com.extension.autofill.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.extension.autofill.model.FillRequest;
import com.extension.autofill.model.ParseRequest;
import com.extension.autofill.model.UpdateRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

@Service
@Slf4j
public class LlmService {

    @Value("${extension.rag.service.url:http://localhost:8000}")
    private String pythonRagUrl;

    private final RestTemplate rest;
    private final ObjectMapper mapper;

    public LlmService() {
        this.rest = new RestTemplate();
        this.mapper = new ObjectMapper();
    }

    public String extractProfile(ParseRequest request) {
        String url = pythonRagUrl + "/api/v1/rag/ingest";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        try {
            HttpEntity<ParseRequest> entity = new HttpEntity<>(request, headers);
            ResponseEntity<String> response = rest.postForEntity(url, entity, String.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to proxy ingest to RAG service", e);
            throw new RuntimeException("RAG Ingestion failed.");
        }
    }

    public String updateProfile(UpdateRequest request) {
        // Handled during ingestion in vector-first design
        return "{\"status\": \"success\"}";
    }

    public Map<String, String> generateAutofillAnswers(FillRequest request) {
        String url = pythonRagUrl + "/api/v1/rag/autofill";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        try {
            HttpEntity<FillRequest> entity = new HttpEntity<>(request, headers);
            ResponseEntity<Map> response = rest.postForEntity(url, entity, Map.class);
            
            if (response.getBody() != null && response.getBody().containsKey("answers")) {
                return (Map<String, String>) response.getBody().get("answers");
            }
            return Collections.emptyMap();
        } catch (Exception e) {
            log.error("Failed to proxy autofill to RAG service", e);
            throw new RuntimeException("RAG Autofill failed.");
        }
    }
}
