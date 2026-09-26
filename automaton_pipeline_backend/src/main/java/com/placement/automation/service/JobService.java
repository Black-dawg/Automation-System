package com.placement.automation.service;

import com.placement.automation.model.JobOpportunity;
import com.placement.automation.model.JobOpportunityEntity;
import com.placement.automation.repository.JobOpportunityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobOpportunityRepository repository;
    private final MessageExtractionService messageExtractionService;
    private final NotionService notionService;
    private final MessageFilterService messageFilterService;

    public List<JobOpportunityEntity> getAllJobs() {
        return repository.findAll();
    }

    public JobOpportunityEntity getJobById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job with ID " + id + " not found."));
    }

    public JobOpportunityEntity createJob(JobOpportunityEntity job) {
        JobOpportunityEntity saved = repository.save(job);
        notionService.syncJobToNotion(saved);
        return saved;
    }

    // Pipeline runner: filters raw text, extracts structured fields using LLM, saves to DB & syncs Notion
    public JobOpportunityEntity processAndSaveNewJobMessage(String rawMessage) {
        if (!messageFilterService.isJobDescription(rawMessage)) {
            throw new IllegalArgumentException("You haven't given a job post message.");
        }

        try {
            JobOpportunity extracted = messageExtractionService.extractJobOpportunity(rawMessage);
            JobOpportunityEntity entity = JobOpportunityEntity.from(extracted);
            JobOpportunityEntity saved = repository.save(entity);
            
            notionService.syncJobToNotion(saved);
            return saved;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process the job. Please check the message details.", e);
        }
    }
}
