package com.placement.automation.repository;

import com.placement.automation.model.JobOpportunityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobOpportunityRepository extends JpaRepository<JobOpportunityEntity, Long> {
}
