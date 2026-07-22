package com.placement.automation.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.placement.automation.service.WhatsAppService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/whatsapp")
@RequiredArgsConstructor
public class WhatsAppWebhookController {

    private final WhatsAppService whatsAppService;

    private static final String VERIFY_TOKEN = "placement_bot_123";

    @GetMapping("/webhook")
    public ResponseEntity<String> verifyWebhook(
            @RequestParam(name = "hub.mode", required = false) String mode,
            @RequestParam(name = "hub.challenge", required = false) String challenge,
            @RequestParam(name = "hub.verify_token", required = false) String token) {

        if ("subscribe".equals(mode) && VERIFY_TOKEN.equals(token)) {
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleIncomingMessage(@RequestBody String payload) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode root = objectMapper.readTree(payload);

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

                        if ("text".equalsIgnoreCase(messageType)) {
                            String messageBody = firstMessage.path("text").path("body").asText();
                            if (!sender.isEmpty() && !messageBody.isEmpty()) {
                                whatsAppService.processIncomingMessage(sender, messageBody);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing WhatsApp payload: " + e.getMessage());
        }

        return ResponseEntity.ok("EVENT_RECEIVED");
    }
}
