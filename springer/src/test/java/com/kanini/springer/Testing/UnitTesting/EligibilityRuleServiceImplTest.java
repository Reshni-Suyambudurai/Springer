package com.kanini.springer.Testing.UnitTesting;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.EligibilityRuleDTO;
import com.kanini.springer.dto.Drive.EligibilityRuleUpdateRequest;
import com.kanini.springer.dto.Drive.EligibilityValidationResult;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.service.Drive.impl.EligibilityRuleServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link EligibilityRuleServiceImpl}.
 *
 * Uses a real ObjectMapper and temp files to test rule evaluation logic,
 * getAllRules, and updateRules.
 */
@ExtendWith(MockitoExtension.class)
class EligibilityRuleServiceImplTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // =========================================================================
    // Helpers
    // =========================================================================

    private EligibilityRuleServiceImpl createServiceWithRulesFile(Path tempDir, EligibilityRuleUpdateRequest rules) throws Exception {
        File rulesFile = tempDir.resolve("EligibilityRule.json").toFile();
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(rulesFile, rules);

        // Use reflection to create the service and set the file path
        // Since the service reads from "EligibilityRule.json" relative to CWD,
        // we test the rule evaluation logic directly
        return new EligibilityRuleServiceImpl(objectMapper);
    }

    private EligibilityRuleDTO buildNumericRule(String field, String operator, Double value, String message) {
        EligibilityRuleDTO rule = new EligibilityRuleDTO();
        rule.setField(field);
        rule.setOperator(operator);
        rule.setValue(value);
        rule.setMessage(message);
        return rule;
    }

    private EligibilityRuleDTO buildBetweenRule(String field, Integer min, Integer max, String message) {
        EligibilityRuleDTO rule = new EligibilityRuleDTO();
        rule.setField(field);
        rule.setOperator("BETWEEN");
        rule.setMin(min);
        rule.setMax(max);
        rule.setMessage(message);
        return rule;
    }

    private EligibilityRuleDTO buildInRule(String field, List<String> allowedValues, String message) {
        EligibilityRuleDTO rule = new EligibilityRuleDTO();
        rule.setField(field);
        rule.setOperator("IN");
        rule.setAllowedValues(allowedValues);
        rule.setMessage(message);
        return rule;
    }

    // =========================================================================
    // getAllRules
    // =========================================================================

    @Nested
    @DisplayName("getAllRules")
    class GetAllRules {

        @Test
        @DisplayName("success - returns rules from existing JSON file")
        void getAllRules_existingFile_returnsRules() {
            // This test uses the actual EligibilityRule.json from the project root
            EligibilityRuleServiceImpl service = new EligibilityRuleServiceImpl(objectMapper);

            EligibilityRuleUpdateRequest result = service.getAllRules();

            assertThat(result).isNotNull();
            assertThat(result.getRules()).isNotEmpty();
            assertThat(result.getLogic()).isNotNull();
        }
    }

    // =========================================================================
    // updateRules
    // =========================================================================

    @Nested
    @DisplayName("updateRules")
    class UpdateRules {

        @Test
        @DisplayName("failure - throws ValidationException when rules list is empty")
        void updateRules_emptyRules_throwsValidation() {
            EligibilityRuleServiceImpl service = new EligibilityRuleServiceImpl(objectMapper);

            EligibilityRuleUpdateRequest request = new EligibilityRuleUpdateRequest();
            request.setRules(List.of());
            request.setLogic("AND");

            assertThatThrownBy(() -> service.updateRules(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Rules cannot be empty");
        }

        @Test
        @DisplayName("success - defaults logic to AND when blank")
        void updateRules_blankLogic_defaultsToAnd() {
            EligibilityRuleServiceImpl service = new EligibilityRuleServiceImpl(objectMapper);

            EligibilityRuleDTO rule = buildNumericRule("CGPA", ">=", 7.0, "CGPA >= {value}");
            EligibilityRuleUpdateRequest request = new EligibilityRuleUpdateRequest();
            request.setRules(List.of(rule));
            request.setLogic("");

            EligibilityRuleUpdateRequest result = service.updateRules(request);

            assertThat(result.getLogic()).isEqualTo("AND");
        }
    }

    // =========================================================================
    // checkEligibility
    // =========================================================================

    @Nested
    @DisplayName("checkEligibility")
    class CheckEligibility {

        @Test
        @DisplayName("success - eligible candidate passes all rules")
        void checkEligibility_allRulesPass_eligible() {
            EligibilityRuleServiceImpl service = new EligibilityRuleServiceImpl(objectMapper);

            // Uses the actual EligibilityRule.json — CGPA >= 7, passout 2022-2026, arrears <= 1
            EligibilityValidationResult result = service.checkEligibility(
                    new BigDecimal("8.5"), 2025, 0, null, null);

            assertThat(result.isEligible()).isTrue();
            assertThat(result.getFailedReasons()).isEmpty();
        }

        @Test
        @DisplayName("failure - low CGPA fails eligibility")
        void checkEligibility_lowCgpa_notEligible() {
            EligibilityRuleServiceImpl service = new EligibilityRuleServiceImpl(objectMapper);

            EligibilityValidationResult result = service.checkEligibility(
                    new BigDecimal("5.0"), 2025, 0, null, null);

            assertThat(result.isEligible()).isFalse();
            assertThat(result.getFailedReasons()).isNotEmpty();
        }

        @Test
        @DisplayName("failure - too many arrears fails eligibility")
        void checkEligibility_tooManyArrears_notEligible() {
            EligibilityRuleServiceImpl service = new EligibilityRuleServiceImpl(objectMapper);

            EligibilityValidationResult result = service.checkEligibility(
                    new BigDecimal("8.5"), 2025, 5, null, null);

            assertThat(result.isEligible()).isFalse();
            assertThat(result.getFailedReasons()).isNotEmpty();
        }

        @Test
        @DisplayName("failure - passout year outside range fails eligibility")
        void checkEligibility_badPassoutYear_notEligible() {
            EligibilityRuleServiceImpl service = new EligibilityRuleServiceImpl(objectMapper);

            EligibilityValidationResult result = service.checkEligibility(
                    new BigDecimal("8.5"), 2019, 0, null, null);

            assertThat(result.isEligible()).isFalse();
            assertThat(result.getFailedReasons()).isNotEmpty();
        }

        @Test
        @DisplayName("success - null CGPA fails evaluation for CGPA rule")
        void checkEligibility_nullCgpa_notEligible() {
            EligibilityRuleServiceImpl service = new EligibilityRuleServiceImpl(objectMapper);

            EligibilityValidationResult result = service.checkEligibility(
                    null, 2025, 0, null, null);

            assertThat(result.isEligible()).isFalse();
        }
    }
}
