package com.placement.automation.model;

import java.util.Map;

public record JobOpportunity(
    String companyName,
    String role,
    String offer,
    String deadline,
    String eligibilityCriteria,
    Map<String, String> applicationLinks,
    Map<String, String> whatsappGroupLinks,
    String extraImportantInfo
) {}
