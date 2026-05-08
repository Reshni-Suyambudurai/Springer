package com.kanini.springer.repository.Common;

import com.kanini.springer.entity.utils.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for EmailTemplate entity
 */
@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Integer> {

    /**
     * Find email templates by list of IDs
     */
    List<EmailTemplate> findByTemplateIdIn(List<Integer> templateIds);
      Optional<EmailTemplate> findByTemplateName(String templateName);
}
