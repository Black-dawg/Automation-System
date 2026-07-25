package com.placement.automation.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.placement.automation.service.WhatsAppService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/whatsapp")
@RequiredArgsConstructor
public class WhatsAppWebhookController {

    private static final String VERIFY_TOKEN = "placement_bot_123";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final WhatsAppService whatsAppService;

    // Meta Webhook Verification endpoint
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

    // Handles incoming WhatsApp messages sent to the webhook
    @PostMapping("/webhook")
    public ResponseEntity<String> handleIncomingMessage(@RequestBody String payload) {
        try {
            JsonNode root = MAPPER.readTree(payload);
            JsonNode entryNode = root.path("entry");
            
            if (entryNode.isArray() && !entryNode.isEmpty()) {
                JsonNode changesNode = entryNode.get(0).path("changes");
                if (changesNode.isArray() && !changesNode.isEmpty()) {
                    JsonNode valueNode = changesNode.get(0).path("value");
                    JsonNode messagesNode = valueNode.path("messages");

                    if (messagesNode.isArray() && !messagesNode.isEmpty()) {
                        JsonNode firstMessage = messagesNode.get(0);
                        String sender = firstMessage.path("from").asText();
                        String messageType = firstMessage.path("type").asText("");

                        if ("text".equalsIgnoreCase(messageType)) {
                            String messageBody = firstMessage.path("text").path("body").asText();
                            if (!sender.isBlank() && !messageBody.isBlank()) {
                                whatsAppService.processIncomingMessage(sender, messageBody);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse incoming WhatsApp webhook payload: {}", e.getMessage());
        }

        return ResponseEntity.ok("EVENT_RECEIVED");
    }
}
