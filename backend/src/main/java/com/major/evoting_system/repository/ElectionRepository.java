package com.major.evoting_system.repository;
import com.major.evoting_system.model.Election;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ElectionRepository extends JpaRepository<Election,Long> {
    List<Election> findByStatus(Election.ElectionStatus status);
    List<Election> findByOrderByCreatedAtDesc();
}
