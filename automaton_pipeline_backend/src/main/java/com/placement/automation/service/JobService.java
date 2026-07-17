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

        JobOpportunityEntity savedJob = repository.save(job);

        notionService.syncJobToNotion(savedJob);

        return savedJob;
    }

    public JobOpportunityEntity processAndSaveNewJobMessage(String rawMessage) {

         JobOpportunity extractedJob = messageExtractionService.extractJobOpportunity(rawMessage);

         JobOpportunityEntity entity = JobOpportunityEntity.from(extractedJob);


        JobOpportunityEntity savedEntity = repository.save(entity);

         notionService.syncJobToNotion(savedEntity);

        return savedEntity;
    }
}
