package com.placement.automation.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.placement.automation.service.WhatsAppService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/whatsapp")
public class WhatsAppWebhookController {

    @Autowired
    private WhatsAppService whatsAppService;

    // Secret verification token for Meta configuration
    private final String VERIFY_TOKEN = "placement_bot_123";

    @GetMapping("/webhook")
    public ResponseEntity<String> verifyWebhook(
            @RequestParam(name = "hub.mode", required = false) String mode,
            @RequestParam(name = "hub.challenge", required = false) String challenge,
            @RequestParam(name = "hub.verify_token", required = false) String token) {

        if ("subscribe".equals(mode) && VERIFY_TOKEN.equals(token)) {
            return ResponseEntity.ok(challenge);
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleIncomingMessage(@RequestBody String payload) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(payload);
            
            // Extract the messages array from WhatsApp JSON
            JsonNode entryNode = root.path("entry");
            if (entryNode.isArray() && entryNode.size() > 0) {
                JsonNode changesNode = entryNode.get(0).path("changes");
                if (changesNode.isArray() && changesNode.size() > 0) {
                    JsonNode valueNode = changesNode.get(0).path("value");
                    JsonNode messagesNode = valueNode.path("messages");
                    
                    if (messagesNode.isArray() && messagesNode.size() > 0) {
                        JsonNode firstMessage = messagesNode.get(0);
                        String sender = firstMessage.path("from").asText();
                        String messageType = firstMessage.path("type").asText("");
                        
                        // We only process text messages
                        if ("text".equalsIgnoreCase(messageType)) {
                            String messageBody = firstMessage.path("text").path("body").asText();
                            
                            if (sender != null && !sender.isEmpty() && messageBody != null && !messageBody.isEmpty()) {
                                // Forward to the service to handle in the background
                                whatsAppService.processIncomingMessage(sender, messageBody);
                            }
                        } else {
                            System.out.println("Received non-text message type: " + messageType);
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing incoming WhatsApp payload: " + e.getMessage());
            e.printStackTrace();
        }

        // WhatsApp needs a 200 OK back quickly
        return ResponseEntity.ok("EVENT_RECEIVED");
    }
}
