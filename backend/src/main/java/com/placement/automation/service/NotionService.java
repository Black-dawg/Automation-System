package com.placement.automation.service;

import com.placement.automation.model.JobOpportunityEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class NotionService {

    @Value("${notion.api.token}")
    private String notionApiToken;

    @Value("${notion.api.database.id}")
    private String notionDatabaseId;

    private final RestTemplate restTemplate;

    public NotionService() {
        this.restTemplate = new RestTemplate();
    }

    public void syncJobToNotion(JobOpportunityEntity job) {
        if (notionApiToken == null || notionApiToken.trim().isEmpty() || notionApiToken.contains("YOUR_NOTION_INTEGRATION_TOKEN")) {
            System.out.println("Notion API Token not configured. Skipping sync.");
            return;
        }

        String url = "https://api.notion.com/v1/pages";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + notionApiToken);
        headers.set("Notion-Version", "2022-06-28");
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        
        Map<String, Object> parent = new HashMap<>();
        parent.put("database_id", notionDatabaseId);
        body.put("parent", parent);

        Map<String, Object> properties = new HashMap<>();

        if (job.getCompanyName() != null) {
            properties.put("Company", createTitleProperty(job.getCompanyName()));
        }
        if (job.getRole() != null) {
            properties.put("Role", createRichTextProperty(job.getRole()));
        }
        if (job.getEligibilityCriteria() != null) {
            properties.put("Eligibility", createRichTextProperty(job.getEligibilityCriteria()));
        }
        if (job.getApplicationLinks() != null && !job.getApplicationLinks().isEmpty()) {
            properties.put("Form", createRichTextProperty(formatLinks(job.getApplicationLinks())));
        }
        if (job.getWhatsappGroupLinks() != null && !job.getWhatsappGroupLinks().isEmpty()) {
            properties.put("WhatsApp", createRichTextProperty(formatLinks(job.getWhatsappGroupLinks())));
        }
        if (job.getExtraImportantInfo() != null) {
            properties.put("Extra Info", createRichTextProperty(job.getExtraImportantInfo()));
        }
        if (job.getDeadline() != null) {
            properties.put("DeadLine", createRichTextProperty(job.getDeadline()));
        }
        if (job.getOffer() != null) {
            properties.put("Offer", createRichTextProperty(job.getOffer()));
        }

        body.put("properties", properties);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            System.out.println("Successfully synced job to Notion: " + response.getStatusCode());
        } catch (Exception e) {
            System.err.println("Failed to sync to Notion: " + e.getMessage());
        }
    }

    private Map<String, Object> createTitleProperty(String text) {
        Map<String, Object> prop = new HashMap<>();
        Map<String, Object> titleObj = new HashMap<>();
        Map<String, Object> textObj = new HashMap<>();
        textObj.put("content", text);
        titleObj.put("text", textObj);
        prop.put("title", new Object[]{titleObj});
        return prop;
    }

    private Map<String, Object> createRichTextProperty(String text) {
        Map<String, Object> prop = new HashMap<>();
        Map<String, Object> rtObj = new HashMap<>();
        Map<String, Object> textObj = new HashMap<>();
        textObj.put("content", text);
        rtObj.put("text", textObj);
        prop.put("rich_text", new Object[]{rtObj});
        return prop;
    }

    private Map<String, Object> createStatusProperty(String name) {
        Map<String, Object> prop = new HashMap<>();
        Map<String, Object> statusObj = new HashMap<>();
        statusObj.put("name", name);
        prop.put("status", statusObj);
        return prop;
    }

    private Map<String, Object> createDateProperty(String date) {
        Map<String, Object> prop = new HashMap<>();
        Map<String, Object> dateObj = new HashMap<>();
        dateObj.put("start", date);
        prop.put("date", dateObj);
        return prop;
    }

    private String formatLinks(Map<String, String> links) {
        if (links == null || links.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : links.entrySet()) {
            sb.append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
        }
        return sb.toString().trim();
    }
}
