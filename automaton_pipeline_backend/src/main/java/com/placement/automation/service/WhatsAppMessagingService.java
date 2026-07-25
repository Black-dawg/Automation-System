package com.placement.automation.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class WhatsAppMessagingService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${whatsapp.api.token:}")
    private String apiToken;

    @Value("${whatsapp.api.phone-number-id:}")
    private String phoneNumberId;

    // Outbound messenger client for WhatsApp Graph API
    public void sendMessage(String recipientPhoneNumber, String messageText) {
        if (apiToken == null || apiToken.isBlank() || phoneNumberId == null || phoneNumberId.isBlank()) {
            return;
        }

        String url = "https://graph.facebook.com/v19.0/" + phoneNumberId + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiToken);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("messaging_product", "whatsapp");
        requestBody.put("recipient_type", "individual");
        requestBody.put("to", recipientPhoneNumber);
        requestBody.put("type", "text");

        Map<String, Object> textNode = new HashMap<>();
        textNode.put("preview_url", false);
        textNode.put("body", messageText);
        requestBody.put("text", textNode);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            restTemplate.postForEntity(url, entity, String.class);
        } catch (Exception e) {
            log.error("Failed to send WhatsApp message: {}", e.getMessage());
        }
    }
}
