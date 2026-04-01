package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.RoundTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoundTemplateRepository extends JpaRepository<RoundTemplate, Long> {
    List<RoundTemplate> findByIsActive(Boolean isActive);
}
