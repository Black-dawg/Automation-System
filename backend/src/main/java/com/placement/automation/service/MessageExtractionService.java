package com.placement.automation.service;

import com.placement.automation.model.JobOpportunity;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class MessageExtractionService {

    private final ChatClient chatClient;

    public MessageExtractionService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public JobOpportunity extractJobOpportunity(String rawMessage) {
        return this.chatClient.prompt()
                .system("""
                        You are an assistant designed to parse unstructured placement notifications and extract relevant details into structured data.
                        Extract the job opportunity details from the given messy WhatsApp message.
                        If a field is not found in the message, leave it as null or empty string.
                        
                        FIELD SPECIFICS:
                        - 'companyName': Extract the name of the company hiring. The company name is typically located on the very first line of the message. If the first line contains multiple pieces of information enclosed in symbols (like asterisks), isolate and extract only the company name portion.
                        - 'offer': Extract any compensation details (Salary, CTC, Stipend, hourly rate, etc.).
                        
                        CRITICAL URL INSTRUCTIONS:
                        - You MUST extract the EXACT, full, and literal URLs exactly as they appear in the source message text.
                        - Do NOT make up, summarize, or alter the URLs. Do NOT output placeholder URLs.
                        - For 'applicationLinks' and 'whatsappGroupLinks', return a key-value map. The key should be a descriptive label found in the text (like "Google Form" or "Announcement Group"), and the value MUST be the actual literal URL from the message.
                        Return the data strictly in the requested JSON structure.
                        """)
                .user(rawMessage)
                .call()
                .entity(JobOpportunity.class);
    }
}
