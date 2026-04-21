package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.entity.Academy.BatchCourse;
import com.kanini.springer.entity.enums.Enums.CourseStatus;
import com.kanini.springer.repository.Academy.BatchCourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchCourseStatusScheduler {

    private final BatchCourseRepository batchCourseRepository;

    @PostConstruct
    public void runOnStartup() {
        updateStatuses();
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void autoUpdateBatchCourseStatuses() {
        updateStatuses();
    }

    private void updateStatuses() {
        LocalDateTime now = LocalDateTime.now();
        List<BatchCourse> allCourses = batchCourseRepository.findAll();
        List<BatchCourse> toUpdate = new ArrayList<>();
        for (BatchCourse bc : allCourses) {
            if (bc.getStatus() == CourseStatus.ACTIVE
                    && bc.getEndDate() != null
                    && now.isAfter(bc.getEndDate())) {
                bc.setStatus(CourseStatus.COMPLETED);
                toUpdate.add(bc);
            }
        }
        // Note: Stream.peek avoided intentionally — explicit loop used for side-effect clarity
        if (!toUpdate.isEmpty()) {
            batchCourseRepository.saveAll(toUpdate);
            log.info("Auto-updated {} batch course status(es)", toUpdate.size());
        }
    }
}
