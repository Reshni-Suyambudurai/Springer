package com.kanini.springer.specification;

import com.kanini.springer.dto.Drive.CandidateFilterRequest;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.entity.enums.Enums.ApplicationType;
import com.kanini.springer.entity.enums.Enums.LifecycleStatus;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Specification builder for dynamic candidate filtering
 * Optimized for performance with indexed fields
 */
public class CandidateSpecification {

    public static Specification<Candidate> withFilters(CandidateFilterRequest filterRequest) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Cycle ID filter (Required & Indexed)
            if (filterRequest.getCycleId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("cycle").get("cycleId"), filterRequest.getCycleId()));
            }

            // Lifecycle Status filter (Indexed)
            if (filterRequest.getLifecycleStatus() != null && !filterRequest.getLifecycleStatus().isEmpty()) {
                try {
                    LifecycleStatus status = LifecycleStatus.valueOf(filterRequest.getLifecycleStatus());
                    predicates.add(criteriaBuilder.equal(root.get("lifecycleStatus"), status));
                } catch (IllegalArgumentException e) {
                    // Invalid status, skip filter
                }
            }

            // Candidate Name filter (Case-insensitive LIKE)
            if (filterRequest.getCandidateName() != null && !filterRequest.getCandidateName().trim().isEmpty()) {
                String namePattern = "%" + filterRequest.getCandidateName().trim().toLowerCase() + "%";
                Predicate firstNameMatch = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("firstName")),
                    namePattern
                );
                Predicate lastNameMatch = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("lastName")),
                    namePattern
                );
                predicates.add(criteriaBuilder.or(firstNameMatch, lastNameMatch));
            }

            // Institute Name filter
            if (filterRequest.getInstituteName() != null && !filterRequest.getInstituteName().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                    root.get("institute").get("instituteName"),
                    filterRequest.getInstituteName()
                ));
            }

            // State filter
            if (filterRequest.getState() != null && !filterRequest.getState().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                    root.get("institute").get("state"),
                    filterRequest.getState()
                ));
            }

            // Cities filter (IN clause)
            if (filterRequest.getCities() != null && !filterRequest.getCities().isEmpty()) {
                predicates.add(root.get("institute").get("city").in(filterRequest.getCities()));
            }

            // Degrees filter (IN clause)
            if (filterRequest.getDegrees() != null && !filterRequest.getDegrees().isEmpty()) {
                predicates.add(root.get("degree").in(filterRequest.getDegrees()));
            }

            // Departments filter (IN clause)
            if (filterRequest.getDepartments() != null && !filterRequest.getDepartments().isEmpty()) {
                predicates.add(root.get("department").in(filterRequest.getDepartments()));
            }

            // Eligibility filter (TRUE/FALSE)
            if (filterRequest.getEligibility() != null && !filterRequest.getEligibility().isEmpty()) {
                List<Predicate> eligibilityPredicates = new ArrayList<>();
                for (String elig : filterRequest.getEligibility()) {
                    if ("true".equalsIgnoreCase(elig)) {
                        eligibilityPredicates.add(criteriaBuilder.isTrue(root.get("isEligible")));
                    } else if ("false".equalsIgnoreCase(elig)) {
                        eligibilityPredicates.add(criteriaBuilder.isFalse(root.get("isEligible")));
                    }
                }
                if (!eligibilityPredicates.isEmpty()) {
                    predicates.add(criteriaBuilder.or(eligibilityPredicates.toArray(new Predicate[0])));
                }
            }

            // Application Types filter (Indexed)
            if (filterRequest.getApplicationTypes() != null && !filterRequest.getApplicationTypes().isEmpty()) {
                List<ApplicationType> types = new ArrayList<>();
                for (String typeStr : filterRequest.getApplicationTypes()) {
                    try {
                        types.add(ApplicationType.valueOf(typeStr));
                    } catch (IllegalArgumentException e) {
                        // Invalid type, skip
                    }
                }
                if (!types.isEmpty()) {
                    predicates.add(root.get("applicationType").in(types));
                }
            }

            // Application Stages filter (Indexed)
            if (filterRequest.getApplicationStages() != null && !filterRequest.getApplicationStages().isEmpty()) {
                List<ApplicationStage> stages = new ArrayList<>();
                for (String stageStr : filterRequest.getApplicationStages()) {
                    try {
                        stages.add(ApplicationStage.valueOf(stageStr));
                    } catch (IllegalArgumentException e) {
                        // Invalid stage, skip
                    }
                }
                if (!stages.isEmpty()) {
                    predicates.add(root.get("applicationStage").in(stages));
                }
            }

            // Skills filter (Join to candidate_skills table)
            if (filterRequest.getSkills() != null && !filterRequest.getSkills().isEmpty()) {
                Join<Object, Object> candidateSkills = root.join("candidateSkills", JoinType.INNER);
                Join<Object, Object> skill = candidateSkills.join("skill", JoinType.INNER);
                predicates.add(skill.get("skillName").in(filterRequest.getSkills()));
            }

            // NOTE: Removed fetch joins to prevent HHH90003004 warning and in-memory pagination
            // Entity graphs are now used at the repository level via @EntityGraph annotation
            // This allows proper database-level pagination with optimized batch fetching

            return predicates.isEmpty()
                    ? criteriaBuilder.conjunction()
                    : criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
