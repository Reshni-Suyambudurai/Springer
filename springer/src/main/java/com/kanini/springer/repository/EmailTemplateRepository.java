package com.kanini.springer.repository;

import com.kanini.springer.entity.utils.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Integer> {

    Optional<EmailTemplate> findByTemplateName(String templateName);
}
