package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.InternCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InternCertificateRepository extends JpaRepository<InternCertificate, Long> {
    List<InternCertificate> findByStudent_StudentId(Long studentId);
}
