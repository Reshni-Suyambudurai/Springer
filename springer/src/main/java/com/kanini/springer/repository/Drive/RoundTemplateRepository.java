package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.RoundTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoundTemplateRepository extends JpaRepository<RoundTemplate, Long> {
    List<RoundTemplate> findByIsActive(Boolean isActive);
    Optional<RoundTemplate> findByRoundNo(Integer roundNo);
    List<RoundTemplate> findByRoundNoOrderByRoundConfigIdAsc(Integer roundNo);
}
