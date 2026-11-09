package com.kanini.springer.Testing.UnitTesting;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.EligibilityRuleDTO;
import com.kanini.springer.dto.Drive.EligibilityRuleUpdateRequest;
import com.kanini.springer.dto.Drive.EligibilityValidationResult;
import com.kanini.springer.service.Drive.impl.EligibilityRuleServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EligibilityRuleServiceImplTest {

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private EligibilityRuleServiceImpl service;

    @Test
    void checkEligibility_screeningDisabled_skipsRulesAndReturnsEligible() throws Exception {
        EligibilityRuleUpdateRequest config = configWithCgpaRule(false);
        when(objectMapper.readValue(any(File.class), eq(EligibilityRuleUpdateRequest.class)))
            .thenReturn(config);

        EligibilityValidationResult result = service.checkEligibility(null, null, null, null, null);

        assertThat(result.isEligible()).isTrue();
        assertThat(result.getFailedReasons()).isEmpty();
    }

    @Test
    void checkEligibility_missingFlag_defaultsToDisabled() throws Exception {
        EligibilityRuleUpdateRequest config = configWithCgpaRule(null);
        when(objectMapper.readValue(any(File.class), eq(EligibilityRuleUpdateRequest.class)))
            .thenReturn(config);

        EligibilityValidationResult result = service.checkEligibility(null, null, null, null, null);

        assertThat(result.isEligible()).isTrue();
        assertThat(result.getFailedReasons()).isEmpty();
    }

    @Test
    void checkEligibility_screeningEnabled_evaluatesRules() throws Exception {
        EligibilityRuleUpdateRequest config = configWithCgpaRule(true);
        when(objectMapper.readValue(any(File.class), eq(EligibilityRuleUpdateRequest.class)))
            .thenReturn(config);

        EligibilityValidationResult result = service.checkEligibility(null, null, null, null, null);

        assertThat(result.isEligible()).isFalse();
        assertThat(result.getFailedReasons()).containsExactly("CGPA must be >= 7.0");
    }

    private EligibilityRuleUpdateRequest configWithCgpaRule(Boolean screeningEnabled) {
        EligibilityRuleDTO rule = new EligibilityRuleDTO(
            "CGPA", ">=", 7.0, null, null, "CGPA must be >= {value}", null);
        EligibilityRuleUpdateRequest config = new EligibilityRuleUpdateRequest();
        config.setRules(List.of(rule));
        config.setLogic("AND");
        config.setScreeningEnabled(screeningEnabled);
        return config;
    }
}