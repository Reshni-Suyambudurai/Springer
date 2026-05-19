package com.kanini.springer.service.Dashboards.impl;

import com.kanini.springer.dto.Analytics.CollegeAnalysisResponse;
import com.kanini.springer.dto.Analytics.DriveDetailsAnalysisResponse;
import com.kanini.springer.dto.Analytics.DriveDetailsAnalysisResponse.DriveBreakdown;
import com.kanini.springer.dto.Dashboards.DriveDashboardResponse;
import com.kanini.springer.dto.Dashboards.DriveDashboardResponse.InstituteSummary;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.entity.enums.Enums.ApplicationStatus;
import com.kanini.springer.entity.enums.Enums.DriveMode;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.Drive.ApplicationRepository;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.repository.Drive.DriveRepository;
import com.kanini.springer.service.Dashboards.IDriveDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private final ApplicationRepository applicationRepository;

    private static final Set<ApplicationStage> SELECTED_STAGES = EnumSet.of(ApplicationStage.SELECTED);
    private static final Set<ApplicationStage> REJECTED_STAGES = EnumSet.of(ApplicationStage.REJECTED);
    private static final Set<ApplicationStage> DROPPED_STAGES = EnumSet.of(ApplicationStage.DROPPED);
    private static final Set<ApplicationStage> ACCEPTED_STAGES = EnumSet.of(ApplicationStage.OFFER_ACCEPTED);
    private static final Set<ApplicationStage> JOINED_STAGES = EnumSet.of(ApplicationStage.JOINED);
    private static final Set<ApplicationStage> NOT_JOINED_STAGES = EnumSet.of(ApplicationStage.NOT_JOINED);
    private static final Set<ApplicationStage> OFFER_REJECTED_STAGES = EnumSet.of(ApplicationStage.OFFER_REJECTED);

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

    // ==================== Drive Details Analysis ====================

    @Override
    @Transactional(readOnly = true)
    public DriveDetailsAnalysisResponse getDriveDetailsAnalysis(Long cycleId) {
        if (cycleId == null) {
            throw new ValidationException("Cycle ID is required");
        }

        DriveDetailsAnalysisResponse response = new DriveDetailsAnalysisResponse();
        response.setCycleId(cycleId);

        // ===== Query 1: Candidate stage counts (reuse existing query) =====
        List<Object[]> stageCounts = candidatesRepository.countByApplicationStageByCycle(cycleId);
        long total = 0, selected = 0, rejected = 0, dropped = 0, accepted = 0, joined = 0;

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

        // ===== Query 2: Drives with institute (1 DB hit) =====
        List<Drive> drives = driveRepository.findByCycleIdWithInstitute(cycleId);
        if (!drives.isEmpty()) {
            response.setCycleName(drives.get(0).getCycle().getCycleName());
            response.setCycleYear(drives.get(0).getCycle().getCycleYear());
        }

        // Derive drive mode counts from loaded drives (no extra DB hit)
        long onCampus = 0, offCampus = 0;
        for (Drive d : drives) {
            if (d.getDriveMode() == DriveMode.ON_CAMPUS) onCampus++;
            else if (d.getDriveMode() == DriveMode.OFF_CAMPUS) offCampus++;
        }
        response.setOnCampusDriveCount(onCampus);
        response.setOffCampusDriveCount(offCampus);

        // ===== Query 3: Per-drive application status counts (1 DB hit) =====
        List<Object[]> statusRows = applicationRepository.countByDriveAndStatusByCycle(cycleId);
        // driveId -> {status -> count}
        Map<Long, Map<ApplicationStatus, Long>> driveStatusMap = new LinkedHashMap<>();
        for (Object[] row : statusRows) {
            Long driveId = (Long) row[0];
            ApplicationStatus status = (ApplicationStatus) row[1];
            long count = (Long) row[2];
            driveStatusMap.computeIfAbsent(driveId, k -> new LinkedHashMap<>()).put(status, count);
        }

        // ===== Query 4: Per-drive batch time counts (1 DB hit) =====
        List<Object[]> batchRows = applicationRepository.countByDriveAndBatchTimeByCycle(cycleId);
        // driveId -> {batchTimeIso -> count}
        Map<Long, Map<String, Long>> driveBatchMap = new LinkedHashMap<>();
        for (Object[] row : batchRows) {
            Long driveId = (Long) row[0];
            LocalDateTime batchTime = (LocalDateTime) row[1];
            long count = (Long) row[2];
            String key = batchTime != null ? batchTime.toString() : "Unscheduled";
            driveBatchMap.computeIfAbsent(driveId, k -> new LinkedHashMap<>()).put(key, count);
        }

        // ===== Assemble per-drive breakdown =====
        List<DriveBreakdown> driveBreakdowns = new ArrayList<>();
        for (Drive d : drives) {
            DriveBreakdown bd = new DriveBreakdown();
            bd.setDriveId(d.getDriveId());
            bd.setDriveName(d.getDriveName());
            bd.setDriveMode(d.getDriveMode() != null ? d.getDriveMode().name() : null);
            bd.setLocation(d.getLocation());
            bd.setInstituteName(d.getInstitute() != null ? d.getInstitute().getInstituteName() : null);
            bd.setStartDate(d.getStartDate());

            // Batch counts
            Map<String, Long> batchCounts = driveBatchMap.getOrDefault(d.getDriveId(), Map.of());
            bd.setDistinctBatchCount(batchCounts.size());
            bd.setBatchApplicationCounts(batchCounts);

            // Application status counts
            Map<ApplicationStatus, Long> statusMap = driveStatusMap.getOrDefault(d.getDriveId(), Map.of());
            long applied = statusMap.values().stream().mapToLong(Long::longValue).sum(); // total applications = applied
            bd.setAppliedCount(applied);
            bd.setSelectedCount(statusMap.getOrDefault(ApplicationStatus.SELECTED, 0L));
            bd.setDroppedCount(statusMap.getOrDefault(ApplicationStatus.DROPPED, 0L));
            bd.setRejectedCount(statusMap.getOrDefault(ApplicationStatus.FAILED, 0L));

            driveBreakdowns.add(bd);
        }
        response.setDrives(driveBreakdowns);

        return response;
    }

    // ==================== College Analysis ====================

    @Override
    @Transactional(readOnly = true)
    public List<CollegeAnalysisResponse> getCollegeAnalysis(Long cycleId) {
        if (cycleId == null) {
            throw new ValidationException("Cycle ID is required");
        }

        // Single query: institute-wise stage breakdown (reuse existing query)
        List<Object[]> rows = candidatesRepository.countByInstituteStageByCycle(cycleId);

        Map<Long, CollegeAnalysisResponse> collegeMap = new LinkedHashMap<>();
        for (Object[] row : rows) {
            Long instituteId = (Long) row[0];
            String instituteName = (String) row[1];
            ApplicationStage stage = (ApplicationStage) row[2];
            long count = (Long) row[3];

            CollegeAnalysisResponse college = collegeMap.computeIfAbsent(instituteId, id -> {
                CollegeAnalysisResponse c = new CollegeAnalysisResponse();
                c.setInstituteId(id);
                c.setInstituteName(instituteName);
                return c;
            });

            college.setTotalAppliedCount(college.getTotalAppliedCount() + count);

            if (SELECTED_STAGES.contains(stage)) college.setSelectedCount(college.getSelectedCount() + count);
            else if (REJECTED_STAGES.contains(stage)) college.setRejectedCount(college.getRejectedCount() + count);
            else if (DROPPED_STAGES.contains(stage)) college.setDroppedCount(college.getDroppedCount() + count);
            else if (ACCEPTED_STAGES.contains(stage)) college.setAcceptedCount(college.getAcceptedCount() + count);
            else if (JOINED_STAGES.contains(stage)) college.setJoinedCount(college.getJoinedCount() + count);
            else if (NOT_JOINED_STAGES.contains(stage)) college.setNotJoinedCount(college.getNotJoinedCount() + count);
            else if (OFFER_REJECTED_STAGES.contains(stage)) college.setOfferRejectedCount(college.getOfferRejectedCount() + count);
        }

        return new ArrayList<>(collegeMap.values());
    }
}
