package com.kanini.springer.service.Trainee.impl;

import com.kanini.springer.dto.Trainee.InternDashboardResponse;
import com.kanini.springer.dto.Trainee.InternDashboardResponse.InternAttendanceRecord;
import com.kanini.springer.dto.Trainee.InternDashboardResponse.InternCourseScore;
import com.kanini.springer.dto.Trainee.InternDashboardResponse.BatchmateScore;
import com.kanini.springer.dto.Trainee.InternDashboardResponse.BatchmateDetailedScore;
import com.kanini.springer.dto.Trainee.InternDashboardResponse.BatchmateCourseScore;
import com.kanini.springer.dto.Trainee.InternDashboardResponse.CourseComparison;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.BatchCourse;
import com.kanini.springer.entity.Academy.BatchSchedule;
import com.kanini.springer.entity.Academy.TrainingScore;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.BatchCourseRepository;
import com.kanini.springer.repository.Academy.BatchScheduleRepository;
import com.kanini.springer.repository.Academy.LeaveRequestRepository;
import com.kanini.springer.repository.Academy.TrainingDayAttendanceRepository;
import com.kanini.springer.repository.Academy.TrainingScoreRepository;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.mapper.Academy.TrainingScoreMapper;
import com.kanini.springer.service.Trainee.IInternService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InternServiceImpl implements IInternService {

    private final CandidatesRepository candidatesRepository;
    private final BatchAllocationRepository allocationRepository;
    private final TrainingScoreRepository scoreRepository;
    private final TrainingDayAttendanceRepository attendanceRepository;
    private final BatchCourseRepository batchCourseRepository;
    private final BatchScheduleRepository batchScheduleRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final TrainingScoreMapper scoreMapper;

    @Override
    @Transactional(readOnly = true)
    public InternDashboardResponse getDashboard(Long userId) {

        Candidate candidate = candidatesRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No candidate linked to user ID: " + userId));

        List<BatchAllocation> allocations = allocationRepository
                .findByCandidate_CandidateId(candidate.getCandidateId());

        BatchAllocation allocation = allocations.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No active batch allocation found for candidate"));

        Long studentId      = allocation.getStudentId();
        Integer programId   = allocation.getProgram().getProgramId();
        Integer batchNumber = allocation.getBatchNumber();

        List<TrainingScore> scores = scoreRepository.findByStudent_StudentId(studentId);

        List<BatchCourse> batchCourses = batchCourseRepository
                .findByProgram_ProgramIdAndBatchNo(programId, batchNumber);

        List<InternCourseScore> courseScores = batchCourses.stream().map(bc -> {
            TrainingScore score = scores.stream()
                    .filter(s -> s.getCourse().getCourseId().equals(bc.getCourse().getCourseId()))
                    .findFirst().orElse(null);
            boolean isCommunication = Boolean.TRUE.equals(bc.getCourse().getIsCommunication());
            int maxScore = isCommunication && bc.getCourse().getCommunicationTemplate() != null
                    ? scoreMapper.sumMaxScoresFromTemplate(bc.getCourse().getCommunicationTemplate())
                    : 100;
            InternCourseScore cs = new InternCourseScore();
            cs.setCourseId(bc.getCourse().getCourseId());
            cs.setCourseName(bc.getCourse().getCourseName());
            cs.setScore(score != null ? score.getScore().doubleValue() : null);
            cs.setStatus(score != null ? score.getStatus().name() : null);
            cs.setReview(score != null ? score.getReview() : null);
            cs.setWeightage(bc.getCourse().getWeightage());
            cs.setMinScore(bc.getCourse().getMinScore());
            cs.setMaxScore(maxScore);
            cs.setIsCommunication(isCommunication);
            cs.setCommunicationBreakdown(score != null ? score.getCommunicationBreakdown() : null);
            cs.setCourseStartDate(bc.getStartDate() != null ? bc.getStartDate().toLocalDate().toString() : null);
            cs.setCourseEndDate(bc.getEndDate() != null ? bc.getEndDate().toLocalDate().toString() : null);
            cs.setCourseStatus(bc.getStatus() != null ? bc.getStatus().name() : null);
            return cs;
        }).toList();

        List<InternAttendanceRecord> attendanceRecords = attendanceRepository
                .findByStudent_StudentId(studentId).stream()
                .sorted(Comparator.comparing(a -> a.getAttendanceDate()))
                .map(a -> new InternAttendanceRecord(a.getAttendanceDate().toString(), a.getIsPresent()))
                .toList();

        BatchSchedule schedule = batchScheduleRepository
                .findByProgram_ProgramIdAndBatchNumber(programId, batchNumber)
                .orElse(null);

        List<BatchAllocation> batchmates = allocationRepository
                .findByProgram_ProgramIdAndBatchNumber(programId, batchNumber).stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .sorted(Comparator.comparingDouble(a ->
                        a.getOverallWeightedScore() != null ? -a.getOverallWeightedScore().doubleValue() : 0))
                .toList();

        // Proper dense rank — ties get the same rank, next rank is not skipped
        int rank = 1;
        double myWeightedScore = allocation.getOverallWeightedScore() != null
                ? allocation.getOverallWeightedScore().doubleValue() : 0;
        for (BatchAllocation bm : batchmates) {
            double bmScore = bm.getOverallWeightedScore() != null
                    ? bm.getOverallWeightedScore().doubleValue() : 0;
            if (bmScore > myWeightedScore) rank++;
        }

        Integer totalApprovedLeaveDays = leaveRequestRepository.sumApprovedLeaveDays(studentId);

        String status = "IN_TRAINING";
        if (allocation.getPerformance() != null) {
            String perf = allocation.getPerformance().name();
            if (perf.equals("PROJECT_READY")) status = "PROJECT_READY";
            else if (perf.equals("DROPPED"))  status = "DROPPED";
        }
        double attPct = allocation.getAttendancePercentage() != null
                ? allocation.getAttendancePercentage().doubleValue() : 0;
        if (attPct > 0 && attPct < 75 && status.equals("IN_TRAINING")) status = "AT_RISK";

        String fullName = candidate.getFirstName()
                + (candidate.getLastName() != null ? " " + candidate.getLastName() : "");

        // Fetch ALL scores for this batch in one query — avoids N+1
        List<Long> batchmateIds = batchmates.stream()
                .map(BatchAllocation::getStudentId)
                .toList();
        List<TrainingScore> allBatchScores = batchmateIds.isEmpty()
                ? java.util.Collections.emptyList()
                : scoreRepository.findByStudent_StudentIdIn(batchmateIds);

        // Build course comparisons
        List<CourseComparison> courseComparisons = batchCourses.stream().map(bc -> {
            Integer courseId  = bc.getCourse().getCourseId();
            String courseName = bc.getCourse().getCourseName();
            Integer weightage = bc.getCourse().getWeightage();
            Integer minScore  = bc.getCourse().getMinScore();

            // Filter from already-fetched batch scores
            List<TrainingScore> allCourseScores = allBatchScores.stream()
                    .filter(s -> s.getCourse().getCourseId().equals(courseId))
                    .toList();

            Double myScore = allCourseScores.stream()
                    .filter(s -> s.getStudent().getStudentId().equals(studentId))
                    .findFirst()
                    .map(s -> s.getScore().doubleValue())
                    .orElse(null);

            double batchAvg = allCourseScores.isEmpty() ? 0 :
                    allCourseScores.stream().mapToDouble(s -> s.getScore().doubleValue()).average().orElse(0);

            double batchHighest = allCourseScores.isEmpty() ? 0 :
                    allCourseScores.stream().mapToDouble(s -> s.getScore().doubleValue()).max().orElse(0);

            int myRank = 1;
            if (myScore != null) {
                for (TrainingScore s : allCourseScores) {
                    if (s.getScore().doubleValue() > myScore) myRank++;
                }
            }

            return new CourseComparison(
                    courseId, courseName, weightage, minScore,
                    myScore,
                    Math.round(batchAvg * 10.0) / 10.0,
                    Math.round(batchHighest * 10.0) / 10.0,
                    myScore != null ? myRank : null,
                    allCourseScores.size()
            );
        }).toList();

        // Build anonymized batch leaderboard
        List<BatchmateScore> leaderboard = new java.util.ArrayList<>();
        for (int i = 0; i < batchmates.size(); i++) {
            BatchAllocation bm = batchmates.get(i);
            leaderboard.add(new BatchmateScore(
                    i + 1,
                    bm.getOverallWeightedScore() != null ? bm.getOverallWeightedScore().doubleValue() : null,
                    bm.getAttendancePercentage() != null ? bm.getAttendancePercentage().doubleValue() : 0.0,
                    bm.getPerformance() != null ? bm.getPerformance().name() : null,
                    bm.getStudentId().equals(studentId)
            ));
        }

        // Build detailed leaderboard with names and per-course scores
        // Pre-build lookup: studentId -> (courseId -> TrainingScore) to avoid N+1
        java.util.Map<Long, java.util.Map<Integer, TrainingScore>> scoresByStudentAndCourse = new java.util.HashMap<>();
        for (TrainingScore ts : allBatchScores) {
            scoresByStudentAndCourse
                .computeIfAbsent(ts.getStudent().getStudentId(), k -> new java.util.HashMap<>())
                .put(ts.getCourse().getCourseId(), ts);
        }

        // Dense rank for detailed leaderboard
        List<BatchmateDetailedScore> detailedLeaderboard = new java.util.ArrayList<>();
        for (BatchAllocation bm : batchmates) {
            double bmScore = bm.getOverallWeightedScore() != null ? bm.getOverallWeightedScore().doubleValue() : 0;
            int bmRank = 1;
            for (BatchAllocation other : batchmates) {
                double otherScore = other.getOverallWeightedScore() != null ? other.getOverallWeightedScore().doubleValue() : 0;
                if (otherScore > bmScore) bmRank++;
            }
            String bmName = bm.getCandidate().getFirstName()
                    + (bm.getCandidate().getLastName() != null ? " " + bm.getCandidate().getLastName() : "");
            java.util.Map<Integer, TrainingScore> bmScoreMap = scoresByStudentAndCourse.getOrDefault(bm.getStudentId(), java.util.Collections.emptyMap());
            List<BatchmateCourseScore> bmCourseScores = batchCourses.stream().map(bc -> {
                TrainingScore ts = bmScoreMap.get(bc.getCourse().getCourseId());
                return new BatchmateCourseScore(
                        bc.getCourse().getCourseId(),
                        bc.getCourse().getCourseName(),
                        ts != null ? ts.getScore().doubleValue() : null,
                        ts != null ? ts.getStatus().name() : null);
            }).toList();
            detailedLeaderboard.add(new BatchmateDetailedScore(
                    bmRank, bmName,
                    bm.getOverallWeightedScore() != null ? bm.getOverallWeightedScore().doubleValue() : null,
                    bm.getAttendancePercentage() != null ? bm.getAttendancePercentage().doubleValue() : 0.0,
                    bm.getPerformance() != null ? bm.getPerformance().name() : null,
                    bm.getStudentId().equals(studentId),
                    bmCourseScores
            ));
        }
        detailedLeaderboard.sort(Comparator.comparingInt(BatchmateDetailedScore::getRank));

        return new InternDashboardResponse(
                studentId, fullName, candidate.getEmail(), candidate.getDepartment(),
                allocation.getProgram().getProgramName(), batchNumber,
                allocation.getProgram().getProgramYear(),
                allocation.getProgram().getLocation() != null ? allocation.getProgram().getLocation().name() : null,
                attPct,
                allocation.getOverallWeightedScore() != null ? allocation.getOverallWeightedScore().doubleValue() : null,
                allocation.getPerformance() != null ? allocation.getPerformance().name() : null,
                status,
                schedule != null && schedule.getStartDate() != null ? schedule.getStartDate().toString() : null,
                schedule != null && schedule.getEndDate() != null ? schedule.getEndDate().toString() : null,
                rank, batchmates.size(), courseScores, attendanceRecords, leaderboard, totalApprovedLeaveDays, courseComparisons,
                detailedLeaderboard
        );
    }
}
