package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.DriveAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriveAssignmentRepository extends JpaRepository<DriveAssignment, Integer> {
    List<DriveAssignment> findByDriveDriveId(Long driveId);
    List<DriveAssignment> findByApplicationApplicationId(Long applicationId);
    List<DriveAssignment> findByUserUserId(Long userId);
}
