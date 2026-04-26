package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.InternProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InternProfileRepository extends JpaRepository<InternProfile, Long> {
    Optional<InternProfile> findByUser_UserId(Long userId);
}
