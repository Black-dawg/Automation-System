package com.placement.automation.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WhatsAppService {

    private final MessageFilterService messageFilterService;
    private final WhatsAppMessagingService whatsAppMessagingService;
    private final JobService jobService;

    // Process incoming webhook message asynchronously to release webhook thread early
    @Async
    public void processIncomingMessage(String sender, String rawMessage) {
        if (!messageFilterService.isJobDescription(rawMessage)) {
            whatsAppMessagingService.sendMessage(sender, "You haven't given a job post message.");
            return;
        }

        whatsAppMessagingService.sendMessage(sender, "Your message has been passed to Job Controller, wait for Notion confirmation.");

        try {
            jobService.processAndSaveNewJobMessage(rawMessage);
            whatsAppMessagingService.sendMessage(sender, "Notion synced!");
        } catch (Exception e) {
            whatsAppMessagingService.sendMessage(sender, "Failed to process the job. Please check the message details.");
        }
    }
}
