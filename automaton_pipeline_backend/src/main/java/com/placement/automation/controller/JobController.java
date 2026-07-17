package com.placement.automation.controller;

import com.placement.automation.model.JobOpportunityEntity;
import com.placement.automation.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @GetMapping
    public ResponseEntity<List<JobOpportunityEntity>> getAllJobs() {
        List<JobOpportunityEntity> jobs = jobService.getAllJobs();
        return ResponseEntity.ok(jobs);
    }

    @PostMapping
    public ResponseEntity<JobOpportunityEntity> createJob(@RequestBody JobOpportunityEntity job) {
        JobOpportunityEntity created = jobService.createJob(job);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/extract")
    public ResponseEntity<JobOpportunityEntity> extractJob(@RequestBody String rawMessage) {
        JobOpportunityEntity extracted = jobService.processAndSaveNewJobMessage(rawMessage);
        return ResponseEntity.status(HttpStatus.CREATED).body(extracted);
    }
}
