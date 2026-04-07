package com.kanini.springer.repository;

import com.kanini.springer.entity.utils.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findBySentTo_UserIdOrderByCreatedAtDesc(Long userId);

    long countBySentTo_UserIdAndIsReadFalse(Long userId);
}
