package com.devportal.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "sync_history")
@Getter @Setter @NoArgsConstructor
public class SyncHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Enums.SyncType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Enums.SyncStatus status = Enums.SyncStatus.RUNNING;

    @Column(length = 2000)
    private String message;

    private int reposFound;
    private int servicesCreated;
    private int servicesUpdated;
    private int docsRefreshed;

    @Column(length = 50)
    private String triggeredBy;

    private LocalDateTime startedAt = LocalDateTime.now();
    private LocalDateTime finishedAt;
}
