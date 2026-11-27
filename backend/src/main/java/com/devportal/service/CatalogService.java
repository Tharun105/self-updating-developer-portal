package com.devportal.service;

import com.devportal.dto.Dtos.ServiceRequest;
import com.devportal.model.*;
import com.devportal.repository.*;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {
    private final SoftwareServiceRepository services;
    private final DocumentationRepository docs;
    private final GithubRepoRepository repos;
    private final SyncService syncService;

    public Page<SoftwareService> search(String q, Enums.ServiceStatus status, String language, Pageable pageable) {
        Specification<SoftwareService> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.<String>get("name")), like),
                        cb.like(cb.lower(cb.coalesce(root.<String>get("description"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.<String>get("owner"), "")), like)));
            }
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (language != null && !language.isBlank()) ps.add(cb.equal(root.get("language"), language));
            return cb.and(ps.toArray(new Predicate[0]));
        };
        return services.findAll(spec, pageable);
    }

    public SoftwareService get(Long id) {
        return services.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found."));
    }

    public List<String> languages() {
        return services.findLanguages();
    }

    public SoftwareService create(ServiceRequest r) {
        if (services.existsByName(r.name().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A service named '" + r.name().trim() + "' already exists.");
        }
        SoftwareService s = new SoftwareService();
        apply(s, r);
        return services.save(s);
    }

    public SoftwareService update(Long id, ServiceRequest r) {
        SoftwareService s = get(id);
        if (services.existsByNameAndIdNot(r.name().trim(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A service named '" + r.name().trim() + "' already exists.");
        }
        apply(s, r);
        return services.save(s);
    }

    @Transactional
    public void delete(Long id) {
        SoftwareService s = get(id);
        docs.deleteByServiceId(id);
        if (s.getGithubRepoId() != null) {
            repos.findByGithubId(s.getGithubRepoId()).ifPresent(r -> {
                r.setServiceLinked(false);
                repos.save(r);
            });
        }
        services.delete(s);
    }

    /** Turns a discovered GitHub repository into a catalogue service. */
    @Transactional
    public SoftwareService importRepo(Long repoId) {
        GithubRepo r = repos.findById(repoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Repository not found."));
        if (services.findByGithubRepoId(r.getGithubId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This repository is already a service.");
        }
        String name = services.existsByName(r.getName()) ? r.getFullName() : r.getName();
        if (services.existsByName(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A service named '" + name + "' already exists.");
        }
        SoftwareService s = new SoftwareService();
        s.setName(name);
        s.setSource(Enums.ServiceSource.GITHUB);
        s.setGithubRepoId(r.getGithubId());
        syncService.applyRepoToService(s, r);
        s = services.save(s);
        r.setServiceLinked(true);
        repos.save(r);
        syncService.refreshReadme(s, r);
        return s;
    }

    private void apply(SoftwareService s, ServiceRequest r) {
        s.setName(r.name().trim());
        s.setDescription(blank(r.description()));
        s.setOwner(blank(r.owner()));
        s.setLanguage(blank(r.language()));
        s.setRepoUrl(blank(r.repoUrl()));
        s.setApiDocUrl(blank(r.apiDocUrl()));
        s.setVersion(blank(r.version()));
        s.setStatus(r.status());
        s.setLastUpdated(LocalDateTime.now());
    }

    private String blank(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
