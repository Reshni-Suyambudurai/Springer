package com.kanini.springer.repository.Hiring;

import com.kanini.springer.entity.HiringReq.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.email = :email")
    Optional<User> findByEmailWithRole(@Param("email") String email);
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByUsername(String username);
    
    boolean existsByEmail(String email);
    
    /**
     * Find users by one or more role IDs with role eagerly fetched
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role r WHERE r.roleId IN :roleIds AND u.isActive = true")
    List<User> findByRoleIdIn(@Param("roleIds") List<Long> roleIds);
}
