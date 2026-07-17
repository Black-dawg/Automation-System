package com.extension.autofill.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.extension.autofill.model.FillRequest;
import com.extension.autofill.model.ParseRequest;
import com.extension.autofill.model.UpdateRequest;
import com.extension.autofill.model.FormField;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class LlmService {

    @Value("${extension.ollama.url}")
    private String ollamaUrl;

    private final RestTemplate rest;
    private final ObjectMapper mapper;

    private static final String PARSE_PROMPT = """
        You are an expert data extraction assistant. Extract the following information from the provided resume and document text to match the standard fields of an Indian engineering college placement form. You can also add Any field if you feel like;
        You must return the output strictly as a valid JSON object. Do not include any introductory text, markdown explanations, or conversational filler.
        Required Fields:
        personal_info:
        full_name, email, phone, dob (DD-MM-YYYY)
        linkedin_url, github_url
        coding_profiles (Extract any links/handles for LeetCode, Codeforces, HackerRank, etc.)
        academics:
        class_10: {board, passing_year, percentage_or_cgpa}
        class_12_or_diploma: {board, passing_year, percentage_or_cgpa}
        undergrad: {degree (e.g., B.Tech/BE), branch, institution, passing_year, current_cgpa, active_backlogs (integer)}
        internships: Array of objects
        {company, role, start_date, end_date, key_responsibilities: [list of strings]}
        technical_skills:
        languages: [list]
        frameworks_and_libraries: [list] (e.g., Pandas, NumPy)
        tools: [list] (e.g., MATLAB, Git)
        projects: Array of objects
        {project_name, brief_description, technologies_used: [list]}
        achievements_and_certifications: [list of strings for hackathons, ranks, or certificates]
        Instructions:
        If a field is missing or not mentioned, strictly use null (do not use "N/A" or "Not Mentioned").
        If active_backlogs is not explicitly mentioned, default to 0.
        Ensure all dates for internships are normalized to MM-YYYY format.
        Ensure percentages are formatted as numbers (e.g., 92.5) rather than strings with symbols.
        Validate that the JSON syntax is perfectly formatted.
        """;

    private static final String MERGE_PROMPT = """
        You are an expert data assistant. You are provided with an existing candidate profile in JSON format, and a new set of PRESET PROFILE INFO.
        Your task is to merge the PRESET PROFILE INFO into the existing JSON profile.
        If the preset info contains new facts (like relocation preference, citizenship, new skills, updated GPA), add or update the relevant fields in the JSON. You may add new keys to the JSON if necessary to capture the preset info accurately.
        Do NOT remove any existing data unless it is explicitly contradicted by the preset info.
        Return strictly the updated, valid JSON object. Do not include markdown formatting like ```json.
        """;

    private static final String GEN_PROMPT = """
        You are an elite Career Strategist and Context Extraction AI helping a candidate apply for roles. Your objective is to read the provided CACHED PROFILE DATA (JSON) and dynamically synthesize the most compelling, accurate answers for the FORM FIELDS TO FILL.
        
        Do not simply look for direct key-to-key matches between the profile and the form. Use semantic reasoning to infer qualifications, combine multiple data points, and adapt the candidate's background to fit the exact intent of the employer's questions.
        
        REASONING & EXTRACTION RULES:
        
        Intent Analysis & Semantic Inference: For factual fields, analyze the intent of the question and scan the entire profile for evidence. If a field asks for a specific skill, check the candidate's projects, coursework, or technical stacks to deduce the answer, even if the exact keyword isn't a standalone key in the JSON.
        
        Narrative Synthesis (Subjective & Behavioral): For open-ended questions (e.g., "Describe a challenge," "Why this role?"), do not copy-paste raw JSON values. Synthesize a professional, compelling narrative. Combine the candidate's relevant hard skills with the specific context of their projects to demonstrate value.
        
        Methodology & Nuance: Highlight the how and why behind the candidate's work when applicable. If the data shows a preference for deep-level problem-solving (e.g., building custom mathematical functions from scratch to maintain precise control over logic rather than relying on standard libraries), weave that dedication to precision into answers about technical challenges or work ethic.
        
        Confidence Threshold: If you can logically infer a strong, factual answer from the provided data, do so. If the profile provides absolutely zero relevant context (e.g., asking for a specific certification not mentioned or implied anywhere), leave the value as an empty string "".
        
        OUTPUT INSTRUCTIONS:
        Return strictly a valid, raw JSON object where the key is the exact Field ID, and the value is the finalized string to input into that field. Do not include Markdown formatting blocks (e.g., no ```json).
        """;

    public LlmService() {
        this.rest = new RestTemplate();
        this.mapper = new ObjectMapper();
    }

    public String extractProfile(ParseRequest request) {
        log.info("Extracting candidate profile using model: {}", request.getModel());
        
        String pdfText = parsePdf(request.getResumeBase64());
        
        StringBuilder sb = new StringBuilder(PARSE_PROMPT);
        sb.append("\n=== PRESET PROFILE INFO ===\n");
        sb.append(request.getPresetInfo() != null ? request.getPresetInfo() : "N/A").append("\n");
        sb.append("\n=== RESUME LINK ===\n");
        sb.append(request.getResumeLink() != null ? request.getResumeLink() : "N/A").append("\n");
        sb.append("\n=== RESUME PDF TEXT ===\n");
        sb.append(pdfText.isEmpty() ? "N/A" : pdfText).append("\n");

        return queryOllama(sb.toString(), request.getModel());
    }

    public String updateProfile(UpdateRequest request) {
        log.info("Updating candidate profile with presets using model: {}", request.getModel());
        
        StringBuilder sb = new StringBuilder(MERGE_PROMPT);
        sb.append("\n=== EXISTING JSON PROFILE ===\n")
          .append(request.getCachedProfile() != null ? request.getCachedProfile() : "{}")
          .append("\n\n=== NEW PRESET INFO ===\n")
          .append(request.getPresetInfo() != null ? request.getPresetInfo() : "N/A");

        return queryOllama(sb.toString(), request.getModel());
    }

    public Map<String, String> generateAutofillAnswers(FillRequest request) {
        log.info("Generating answers for form fields using model: {}", request.getModel());
        
        StringBuilder sb = new StringBuilder(GEN_PROMPT);
        sb.append("\n=== CACHED PROFILE DATA ===\n")
          .append(request.getCachedProfile() != null ? request.getCachedProfile() : "{}")
          .append("\n\n=== FORM FIELDS TO FILL ===\n");

        if (request.getFormFields() != null) {
            for (FormField field : request.getFormFields()) {
                sb.append("- ID: ").append(field.getFieldId()).append(", Label: ").append(field.getFieldLabel());
                if (field.getOptions() != null && !field.getOptions().isEmpty()) {
                    sb.append(", Options: [").append(String.join(", ", field.getOptions())).append("]");
                }
                sb.append("\n");
            }
        }

        String resultJson = queryOllama(sb.toString(), request.getModel());
        return parseJsonToMap(resultJson);
    }

    private String queryOllama(String prompt, String modelName) {
        String url = ollamaUrl + "/api/generate";
        String finalModel = (modelName == null || modelName.trim().isEmpty()) ? "llama3.2" : modelName.trim();

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", finalModel);
        payload.put("prompt", prompt);
        payload.put("stream", false);
        payload.put("format", "json");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            String jsonBody = mapper.writeValueAsString(payload);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);
            ResponseEntity<String> response = rest.postForEntity(url, entity, String.class);

            JsonNode rootNode = mapper.readTree(response.getBody());
            return cleanRawJson(rootNode.path("response").asText());
        } catch (Exception e) {
            log.error("Ollama execution failed", e);
            throw new RuntimeException("Ollama call failed. Verify service at " + ollamaUrl);
        }
    }

    private String parsePdf(String base64Pdf) {
        if (base64Pdf == null || base64Pdf.trim().isEmpty()) {
            return "";
        }
        try {
            byte[] pdfBytes = Base64.getDecoder().decode(base64Pdf.trim());
            try (PDDocument document = PDDocument.load(pdfBytes)) {
                return new PDFTextStripper().getText(document);
            }
        } catch (Exception e) {
            log.error("Failed to parse PDF resume bytes", e);
            throw new RuntimeException("Failed to read PDF resume: " + e.getMessage());
        }
    }

    private String cleanRawJson(String text) {
        if (text == null) return "{}";
        return text.replaceAll("^```json\\s*", "").replaceAll("```\\s*$", "").trim();
    }

    private Map<String, String> parseJsonToMap(String jsonText) {
        if (jsonText == null || jsonText.trim().isEmpty() || "{}".equals(jsonText.trim())) {
            return Collections.emptyMap();
        }
        try {
            return mapper.readValue(jsonText, new TypeReference<HashMap<String, String>>() {});
        } catch (JsonProcessingException e) {
            log.error("Failed to parse JSON answer mappings", e);
            throw new RuntimeException("Failed to decode LLM response mapping.");
        }
    }
}
