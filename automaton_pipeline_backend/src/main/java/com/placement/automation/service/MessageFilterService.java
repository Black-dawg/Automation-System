package com.placement.automation.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MessageFilterService {

    private final ChatClient chatClient;

    @Autowired
    public MessageFilterService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    // Quick LLM check to filter out casual chatter and detect placement notices
    public boolean isJobDescription(String rawMessage) {
        if (rawMessage == null || rawMessage.isBlank()) {
            return false;
        }

        try {
            String response = this.chatClient.prompt()
                    .options(OpenAiChatOptions.builder().withMaxTokens(5).build())
                    .system("Analyze if this message is a job opening, internship description, or placement post. Reply with ONLY 'yes' or 'no'.")
                    .user(rawMessage)
                    .call()
                    .content();

            return response != null && response.trim().toLowerCase().contains("yes");
        } catch (Exception e) {
            return false;
        }
    }
}
