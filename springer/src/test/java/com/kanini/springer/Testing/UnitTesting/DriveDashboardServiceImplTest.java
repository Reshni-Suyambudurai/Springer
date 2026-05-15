package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Dashboards.DriveDashboardResponse;
import com.kanini.springer.dto.Dashboards.DriveDashboardResponse.InstituteSummary;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.repository.Drive.DriveRepository;
import com.kanini.springer.service.Dashboards.impl.DriveDashboardServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link DriveDashboardServiceImpl}.
 *
 * Uses Mockito only — no Spring context loaded.
 */
@ExtendWith(MockitoExtension.class)
class DriveDashboardServiceImplTest {

    @InjectMocks
    private DriveDashboardServiceImpl service;

    @Mock
    private CandidatesRepository candidatesRepository;

    @Mock
    private DriveRepository driveRepository;

    private static final Long CYCLE_ID = 1L;

    // =========================================================================
    // getDriveSummary — validation
    // =========================================================================

    @Nested
    @DisplayName("getDriveSummary — validation")
    class Validation {

        @Test
        @DisplayName("failure - throws ValidationException when cycleId is null")
        void getDriveSummary_nullCycleId_throwsValidation() {
            assertThatThrownBy(() -> service.getDriveSummary(null))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cycle ID is required");
        }
    }

    // =========================================================================
    // getDriveSummary — candidate stage counts
    // =========================================================================

    @Nested
    @DisplayName("getDriveSummary — stage counts")
    class StageCounts {

        @Test
        @DisplayName("success - returns correct stage counts")
        void getDriveSummary_withStageCounts_returnsCorrectCounts() {
            List<Object[]> stageCounts = List.of(
                    new Object[]{ApplicationStage.SELECTED, 10L},
                    new Object[]{ApplicationStage.REJECTED, 5L},
                    new Object[]{ApplicationStage.DROPPED, 3L},
                    new Object[]{ApplicationStage.OFFER_ACCEPTED, 8L},
                    new Object[]{ApplicationStage.JOINED, 6L}
            );

            when(candidatesRepository.countByApplicationStageByCycle(CYCLE_ID)).thenReturn(stageCounts);
            when(driveRepository.countByLocationByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());
            when(candidatesRepository.countByInstituteStageByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());

            DriveDashboardResponse result = service.getDriveSummary(CYCLE_ID);

            assertThat(result.getTotalCandidates()).isEqualTo(32L);
            assertThat(result.getSelectedCount()).isEqualTo(10L);
            assertThat(result.getRejectedCount()).isEqualTo(5L);
            assertThat(result.getDroppedCount()).isEqualTo(3L);
            assertThat(result.getAcceptedCount()).isEqualTo(8L);
            assertThat(result.getJoinedCount()).isEqualTo(6L);
        }

        @Test
        @DisplayName("success - returns zeros when no candidates exist")
        void getDriveSummary_noCandidates_returnsZeros() {
            when(candidatesRepository.countByApplicationStageByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());
            when(driveRepository.countByLocationByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());
            when(candidatesRepository.countByInstituteStageByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());

            DriveDashboardResponse result = service.getDriveSummary(CYCLE_ID);

            assertThat(result.getTotalCandidates()).isZero();
            assertThat(result.getSelectedCount()).isZero();
            assertThat(result.getRejectedCount()).isZero();
            assertThat(result.getDroppedCount()).isZero();
            assertThat(result.getAcceptedCount()).isZero();
            assertThat(result.getJoinedCount()).isZero();
        }
    }

    // =========================================================================
    // getDriveSummary — drive location map
    // =========================================================================

    @Nested
    @DisplayName("getDriveSummary — location map")
    class LocationMap {

        @Test
        @DisplayName("success - returns location counts")
        void getDriveSummary_withLocations_returnsMap() {
            List<Object[]> locationCounts = List.of(
                    new Object[]{"Chennai", 5L},
                    new Object[]{"Bangalore", 3L}
            );

            when(candidatesRepository.countByApplicationStageByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());
            when(driveRepository.countByLocationByCycle(CYCLE_ID)).thenReturn(locationCounts);
            when(candidatesRepository.countByInstituteStageByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());

            DriveDashboardResponse result = service.getDriveSummary(CYCLE_ID);

            assertThat(result.getDriveLocationMap())
                    .hasSize(2)
                    .containsEntry("Chennai", 5L)
                    .containsEntry("Bangalore", 3L);
        }

        @Test
        @DisplayName("success - maps null location to 'Unknown'")
        void getDriveSummary_nullLocation_mapsToUnknown() {
            List<Object[]> locationCounts = Collections.singletonList(
                    new Object[]{null, 2L}
            );

            when(candidatesRepository.countByApplicationStageByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());
            when(driveRepository.countByLocationByCycle(CYCLE_ID)).thenReturn(locationCounts);
            when(candidatesRepository.countByInstituteStageByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());

            DriveDashboardResponse result = service.getDriveSummary(CYCLE_ID);

            assertThat(result.getDriveLocationMap())
                    .containsEntry("Unknown", 2L);
        }

        @Test
        @DisplayName("success - returns empty map when no drives")
        void getDriveSummary_noLocations_returnsEmptyMap() {
            when(candidatesRepository.countByApplicationStageByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());
            when(driveRepository.countByLocationByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());
            when(candidatesRepository.countByInstituteStageByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());

            DriveDashboardResponse result = service.getDriveSummary(CYCLE_ID);

            assertThat(result.getDriveLocationMap()).isEmpty();
        }
    }

    // =========================================================================
    // getDriveSummary — institute summaries
    // =========================================================================

    @Nested
    @DisplayName("getDriveSummary — institute summaries")
    class InstituteSummaries {

        @Test
        @DisplayName("success - aggregates institute-wise stage breakdown")
        void getDriveSummary_withInstituteData_returnsAggregatedSummaries() {
            List<Object[]> instituteRows = List.of(
                    new Object[]{1L, "MIT", ApplicationStage.SELECTED, 4L},
                    new Object[]{1L, "MIT", ApplicationStage.REJECTED, 2L},
                    new Object[]{2L, "VIT", ApplicationStage.OFFER_ACCEPTED, 7L},
                    new Object[]{2L, "VIT", ApplicationStage.JOINED, 3L}
            );

            when(candidatesRepository.countByApplicationStageByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());
            when(driveRepository.countByLocationByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());
            when(candidatesRepository.countByInstituteStageByCycle(CYCLE_ID)).thenReturn(instituteRows);

            DriveDashboardResponse result = service.getDriveSummary(CYCLE_ID);

            assertThat(result.getInstituteSummaries()).hasSize(2);

            InstituteSummary mit = result.getInstituteSummaries().stream()
                    .filter(s -> s.getInstituteName().equals("MIT")).findFirst().orElseThrow();
            assertThat(mit.getTotalCandidates()).isEqualTo(6L);
            assertThat(mit.getSelectedCount()).isEqualTo(4L);
            assertThat(mit.getRejectedCount()).isEqualTo(2L);

            InstituteSummary vit = result.getInstituteSummaries().stream()
                    .filter(s -> s.getInstituteName().equals("VIT")).findFirst().orElseThrow();
            assertThat(vit.getTotalCandidates()).isEqualTo(10L);
            assertThat(vit.getAcceptedCount()).isEqualTo(7L);
            assertThat(vit.getJoinedCount()).isEqualTo(3L);
        }

        @Test
        @DisplayName("success - returns empty list when no institute data")
        void getDriveSummary_noInstituteData_returnsEmptyList() {
            when(candidatesRepository.countByApplicationStageByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());
            when(driveRepository.countByLocationByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());
            when(candidatesRepository.countByInstituteStageByCycle(CYCLE_ID)).thenReturn(Collections.emptyList());

            DriveDashboardResponse result = service.getDriveSummary(CYCLE_ID);

            assertThat(result.getInstituteSummaries()).isEmpty();
        }
    }

    // =========================================================================
    // getDriveSummary — full combined scenario
    // =========================================================================

    @Nested
    @DisplayName("getDriveSummary — full scenario")
    class FullScenario {

        @Test
        @DisplayName("success - returns complete response with all sections populated")
        void getDriveSummary_allData_returnsCompleteResponse() {
            List<Object[]> stageCounts = List.of(
                    new Object[]{ApplicationStage.SELECTED, 15L},
                    new Object[]{ApplicationStage.REJECTED, 4L},
                    new Object[]{ApplicationStage.JOINED, 10L}
            );
            List<Object[]> locationCounts = Collections.singletonList(
                    new Object[]{"Chennai", 3L}
            );
            List<Object[]> instituteRows = Collections.singletonList(
                    new Object[]{1L, "IIT Madras", ApplicationStage.SELECTED, 15L}
            );

            when(candidatesRepository.countByApplicationStageByCycle(CYCLE_ID)).thenReturn(stageCounts);
            when(driveRepository.countByLocationByCycle(CYCLE_ID)).thenReturn(locationCounts);
            when(candidatesRepository.countByInstituteStageByCycle(CYCLE_ID)).thenReturn(instituteRows);

            DriveDashboardResponse result = service.getDriveSummary(CYCLE_ID);

            assertThat(result.getTotalCandidates()).isEqualTo(29L);
            assertThat(result.getDriveLocationMap()).containsKey("Chennai");
            assertThat(result.getInstituteSummaries()).hasSize(1);
            assertThat(result.getInstituteSummaries().get(0).getInstituteName()).isEqualTo("IIT Madras");

            verify(candidatesRepository).countByApplicationStageByCycle(CYCLE_ID);
            verify(driveRepository).countByLocationByCycle(CYCLE_ID);
            verify(candidatesRepository).countByInstituteStageByCycle(CYCLE_ID);
        }
    }
}
