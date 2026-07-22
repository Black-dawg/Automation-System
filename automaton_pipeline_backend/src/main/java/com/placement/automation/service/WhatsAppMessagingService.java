package com.placement.automation.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsAppMessagingService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${whatsapp.api.token:}")
    private String apiToken;

    @Value("${whatsapp.api.phone-number-id:}")
    private String phoneNumberId;

    public void sendMessage(String recipientPhoneNumber, String messageText) {
        if (apiToken == null || apiToken.isEmpty() || phoneNumberId == null || phoneNumberId.isEmpty()) {
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
            System.err.println("Failed to send WhatsApp message: " + e.getMessage());
        }
    }
}
