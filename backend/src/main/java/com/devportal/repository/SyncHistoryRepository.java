package com.devportal.repository;

import com.devportal.model.Enums;
import com.devportal.model.SyncHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SyncHistoryRepository extends JpaRepository<SyncHistory, Long> {
    List<SyncHistory> findAllByOrderByStartedAtDesc(Pageable pageable);
    Optional<SyncHistory> findFirstByOrderByStartedAtDesc();
    long countByStatus(Enums.SyncStatus status);
}
