package com.placement.automation.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class WhatsAppService {

    @Autowired
    private MessageFilterService messageFilterService;

    @Autowired
    private WhatsAppMessagingService whatsAppMessagingService;

    @Autowired
    private JobService jobService;

    @Async
    public void processIncomingMessage(String sender, String rawMessage) {
        System.out.println("Processing new WhatsApp message from: " + maskPhoneNumber(sender));

        boolean isJob = messageFilterService.isJobDescription(rawMessage);

        if (!isJob) {
            System.out.println("Message is not a job description, notifying user.");
            whatsAppMessagingService.sendMessage(sender, "You haven't given a job post message.");
            return;
        }

        System.out.println("Message accepted. Notifying user and passing to jobService...");
        whatsAppMessagingService.sendMessage(sender, "Your message has been passed to Job Controller, wait for Notion confirmation.");

        try {
            jobService.processAndSaveNewJobMessage(rawMessage);
            System.out.println("Successfully saved job and synced with Notion!");
            whatsAppMessagingService.sendMessage(sender, "Notion synced!");
        } catch (Exception e) {
            System.err.println("Error processing job message: " + e.getMessage());
            whatsAppMessagingService.sendMessage(sender, "Failed to process the job. Please check the message details.");
        }
    }

    private String maskPhoneNumber(String num) {
        if (num == null || num.length() <= 4) {
            return num;
        }
        StringBuilder masked = new StringBuilder();
        for (int i = 0; i < num.length() - 4; i++) {
            masked.append("X");
        }
        masked.append(num.substring(num.length() - 4));
        return masked.toString();
    }
}
