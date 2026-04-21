package com.kanini.springer.dto.Trainee;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternDashboardResponse {

    private Long studentId;
    private String candidateName;
    private String email;
    private String department;
    private String programName;
    private Integer batchNumber;
    private Integer programYear;
    private String location;
    private Double attendancePercentage;
    private Double overallWeightedScore;
    private String performance;
    private String status;
    private String batchStartDate;
    private String batchEndDate;
    private Integer rank;
    private Integer totalInBatch;
    private List<InternCourseScore> courseScores;
    private List<InternAttendanceRecord> attendanceRecords;
    private List<BatchmateScore> batchLeaderboard;
    private Integer totalApprovedLeaveDays;
    private List<CourseComparison> courseComparisons;
    private List<BatchmateDetailedScore> detailedLeaderboard;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InternCourseScore {
        private Integer courseId;
        private String courseName;
        private Double score;
        private String status;
        private String review;
        private Integer weightage;
        private Integer minScore;
        /** For technical: 100. For communication: sum of all sub-field maxScores. */
        private Integer maxScore;
        private Boolean isCommunication;
        private String communicationBreakdown; // JSON, only for communication courses
        private String courseStartDate;
        private String courseEndDate;
        private String courseStatus;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InternAttendanceRecord {
        private String date;
        private Boolean isPresent;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchmateScore {
        private Integer rank;
        private Double weightedScore;
        private Double attendancePercentage;
        private String performance;
        private Boolean isMe;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchmateDetailedScore {
        private Integer rank;
        private String candidateName;
        private Double weightedScore;
        private Double attendancePercentage;
        private String performance;
        private Boolean isMe;
        private List<BatchmateCourseScore> courseScores;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchmateCourseScore {
        private Integer courseId;
        private String courseName;
        private Double score;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseComparison {
        private Integer courseId;
        private String courseName;
        private Integer weightage;
        private Integer minScore;
        private Double myScore;          // this intern's score
        private Double batchAverage;     // average of all scored students
        private Double batchHighest;     // highest score in batch
        private Integer myRankInCourse;  // rank among scored students
        private Integer totalScoredInCourse;
    }
}
