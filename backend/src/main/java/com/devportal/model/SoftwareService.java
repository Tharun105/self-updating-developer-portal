package com.devportal.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "services")
@Getter @Setter @NoArgsConstructor
public class SoftwareService {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(length = 100)
    private String owner;

    @Column(length = 50)
    private String language;

    @Column(length = 500)
    private String repoUrl;

    @Column(length = 500)
    private String apiDocUrl;

    @Column(length = 30)
    private String version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Enums.ServiceStatus status = Enums.ServiceStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Enums.ServiceSource source = Enums.ServiceSource.MANUAL;

    /** GitHub repository id when the service was discovered/imported from GitHub. */
    private Long githubRepoId;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime lastUpdated = LocalDateTime.now();
}
