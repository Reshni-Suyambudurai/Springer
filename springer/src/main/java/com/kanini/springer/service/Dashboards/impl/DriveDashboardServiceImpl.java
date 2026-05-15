package com.kanini.springer.service.Dashboards.impl;

import com.kanini.springer.dto.Dashboards.DriveDashboardResponse;
import com.kanini.springer.dto.Dashboards.DriveDashboardResponse.InstituteSummary;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.repository.Drive.DriveRepository;
import com.kanini.springer.service.Dashboards.IDriveDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DriveDashboardServiceImpl implements IDriveDashboardService {

    private final CandidatesRepository candidatesRepository;
    private final DriveRepository driveRepository;

    private static final Set<ApplicationStage> SELECTED_STAGES = EnumSet.of(ApplicationStage.SELECTED);
    private static final Set<ApplicationStage> REJECTED_STAGES = EnumSet.of(ApplicationStage.REJECTED);
    private static final Set<ApplicationStage> DROPPED_STAGES = EnumSet.of(ApplicationStage.DROPPED);
    private static final Set<ApplicationStage> ACCEPTED_STAGES = EnumSet.of(ApplicationStage.OFFER_ACCEPTED);
    private static final Set<ApplicationStage> JOINED_STAGES = EnumSet.of(ApplicationStage.JOINED);

    @Override
    @Transactional(readOnly = true)
    public DriveDashboardResponse getDriveSummary(Long cycleId) {
        if (cycleId == null) {
            throw new ValidationException("Cycle ID is required");
        }

        DriveDashboardResponse response = new DriveDashboardResponse();

        // ===== Query 1: Candidate stage counts (1 DB hit) =====
        List<Object[]> stageCounts = candidatesRepository.countByApplicationStageByCycle(cycleId);
        long total = 0;
        long selected = 0, rejected = 0, dropped = 0, accepted = 0, joined = 0;

        for (Object[] row : stageCounts) {
            ApplicationStage stage = (ApplicationStage) row[0];
            long count = (Long) row[1];
            total += count;

            if (SELECTED_STAGES.contains(stage)) selected += count;
            else if (REJECTED_STAGES.contains(stage)) rejected += count;
            else if (DROPPED_STAGES.contains(stage)) dropped += count;
            else if (ACCEPTED_STAGES.contains(stage)) accepted += count;
            else if (JOINED_STAGES.contains(stage)) joined += count;
        }

        response.setTotalCandidates(total);
        response.setSelectedCount(selected);
        response.setRejectedCount(rejected);
        response.setDroppedCount(dropped);
        response.setAcceptedCount(accepted);
        response.setJoinedCount(joined);

        // ===== Query 2: Drive location map (1 DB hit) =====
        List<Object[]> locationCounts = driveRepository.countByLocationByCycle(cycleId);
        Map<String, Long> driveLocationMap = new LinkedHashMap<>();
        for (Object[] row : locationCounts) {
            String location = (String) row[0];
            long count = (Long) row[1];
            driveLocationMap.put(location != null ? location : "Unknown", count);
        }
        response.setDriveLocationMap(driveLocationMap);

        // ===== Query 3: Institute-wise stage breakdown (1 DB hit) =====
        List<Object[]> instituteStageRows = candidatesRepository.countByInstituteStageByCycle(cycleId);

        // Aggregate rows into InstituteSummary objects using a map keyed by instituteId
        Map<Long, InstituteSummary> instituteMap = new LinkedHashMap<>();
        for (Object[] row : instituteStageRows) {
            Long instituteId = (Long) row[0];
            String instituteName = (String) row[1];
            ApplicationStage stage = (ApplicationStage) row[2];
            long count = (Long) row[3];

            InstituteSummary summary = instituteMap.computeIfAbsent(instituteId, id -> {
                InstituteSummary s = new InstituteSummary();
                s.setInstituteId(id);
                s.setInstituteName(instituteName);
                return s;
            });

            summary.setTotalCandidates(summary.getTotalCandidates() + count);

            if (SELECTED_STAGES.contains(stage)) summary.setSelectedCount(summary.getSelectedCount() + count);
            else if (REJECTED_STAGES.contains(stage)) summary.setRejectedCount(summary.getRejectedCount() + count);
            else if (DROPPED_STAGES.contains(stage)) summary.setDroppedCount(summary.getDroppedCount() + count);
            else if (ACCEPTED_STAGES.contains(stage)) summary.setAcceptedCount(summary.getAcceptedCount() + count);
            else if (JOINED_STAGES.contains(stage)) summary.setJoinedCount(summary.getJoinedCount() + count);
        }

        response.setInstituteSummaries(new ArrayList<>(instituteMap.values()));

        return response;
    }
}
