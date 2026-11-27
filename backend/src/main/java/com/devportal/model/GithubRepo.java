package com.devportal.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "github_repositories")
@Getter @Setter @NoArgsConstructor
public class GithubRepo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long githubId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 250)
    private String fullName;

    @Column(length = 1000)
    private String description;

    @Column(length = 100)
    private String owner;

    @Column(length = 50)
    private String language;

    @Column(length = 500)
    private String url;

    private int stars;
    private boolean archived;
    private boolean serviceLinked;
    private LocalDateTime lastUpdated;
    private LocalDateTime discoveredAt = LocalDateTime.now();
}
