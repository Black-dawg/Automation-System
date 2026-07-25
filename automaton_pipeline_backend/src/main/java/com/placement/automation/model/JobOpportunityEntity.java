package com.placement.automation.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "job_opportunities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobOpportunityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String companyName;
    private String role;
    private String offer;
    private String deadline;

    @Column(columnDefinition = "TEXT")
    private String eligibilityCriteria;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> applicationLinks;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> whatsappGroupLinks;

    @Column(columnDefinition = "TEXT")
    private String extraImportantInfo;

    // Mapping factory method from LLM DTO Record to JPA Entity
    public static JobOpportunityEntity from(JobOpportunity record) {
        if (record == null) {
            return null;
        }
        return JobOpportunityEntity.builder()
                .companyName(record.companyName())
                .role(record.role())
                .offer(record.offer())
                .deadline(record.deadline())
                .eligibilityCriteria(record.eligibilityCriteria())
                .applicationLinks(record.applicationLinks())
                .whatsappGroupLinks(record.whatsappGroupLinks())
                .extraImportantInfo(record.extraImportantInfo())
                .build();
    }
}
