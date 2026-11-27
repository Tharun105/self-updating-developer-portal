package com.devportal.service;

import com.devportal.dto.Dtos.DashboardStats;
import com.devportal.model.Enums;
import com.devportal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final SoftwareServiceRepository services;
    private final GithubRepoRepository repos;
    private final DocumentationRepository docs;
    private final SyncHistoryRepository history;
    private final UserRepository users;

    @Value("${github.owners:}") private String owners;
    @Value("${sync.cron:}") private String cron;
    @Value("${sync.enabled:true}") private boolean syncEnabled;
    @Value("${sync.auto-create-services:true}") private boolean autoCreate;
    @Value("${github.token:}") private String token;

    public DashboardStats stats() {
        Map<String, Long> languages = new LinkedHashMap<>();
        services.languageCounts().stream()
                .sorted((a, b) -> Long.compare((Long) b[1], (Long) a[1]))
                .forEach(row -> languages.merge(row[0] == null ? "Unknown" : (String) row[0], (Long) row[1], Long::sum));
        return new DashboardStats(
                services.count(),
                services.countByStatus(Enums.ServiceStatus.ACTIVE),
                services.countByStatus(Enums.ServiceStatus.INACTIVE),
                repos.count(),
                docs.count(),
                services.findTop5ByOrderByLastUpdatedDesc(),
                history.findAllByOrderByStartedAtDesc(PageRequest.of(0, 8)),
                languages,
                history.findFirstByOrderByStartedAtDesc().orElse(null));
    }

    public Map<String, Object> adminOverview() {
        Map<String, Long> byRole = new LinkedHashMap<>();
        for (Enums.Role r : Enums.Role.values()) byRole.put(r.name(), users.countByRole(r));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalUsers", users.count());
        m.put("usersByRole", byRole);
        m.put("totalSyncs", history.count());
        m.put("failedSyncs", history.countByStatus(Enums.SyncStatus.FAILED));
        m.put("schedulerEnabled", syncEnabled);
        m.put("schedulerCron", cron);
        m.put("autoCreateServices", autoCreate);
        m.put("githubOwners", owners);
        m.put("githubTokenConfigured", token != null && !token.isBlank());
        return m;
    }
}
