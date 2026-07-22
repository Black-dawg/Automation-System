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

    public List<JobOpportunityEntity> getAllJobs() {
        return repository.findAll();
    }

    public JobOpportunityEntity createJob(JobOpportunityEntity job) {
        JobOpportunityEntity saved = repository.save(job);
        notionService.syncJobToNotion(saved);
        return saved;
    }

    public JobOpportunityEntity processAndSaveNewJobMessage(String rawMessage) {
        JobOpportunity extracted = messageExtractionService.extractJobOpportunity(rawMessage);
        JobOpportunityEntity entity = JobOpportunityEntity.from(extracted);
        JobOpportunityEntity saved = repository.save(entity);
        notionService.syncJobToNotion(saved);
        return saved;
    }
}
