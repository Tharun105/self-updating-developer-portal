package com.devportal.service;

import com.devportal.dto.GithubRepoDto;
import com.devportal.model.*;
import com.devportal.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;
import java.util.regex.Pattern;

/**
 * Discovers repositories on GitHub, turns them into catalogue services and keeps
 * service metadata + documentation in sync. Used by the scheduler and the manual sync API.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncService {
    private static final Pattern OWNER = Pattern.compile("^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$");

    private final GitHubClient github;
    private final GithubRepoRepository repos;
    private final SoftwareServiceRepository services;
    private final DocumentationRepository docs;
    private final SyncHistoryRepository history;

    @Value("${github.owners:}") private String configuredOwners;
    @Value("${sync.auto-create-services:true}") private boolean autoCreate;
    @Value("${sync.inactive-after-days:180}") private int inactiveDays;

    private final ReentrantLock lock = new ReentrantLock();

    public SyncHistory run(Enums.SyncType type, String triggeredBy, String extraOwner) {
        if (extraOwner != null && !extraOwner.isBlank() && !OWNER.matcher(extraOwner.trim()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid GitHub username or organisation.");
        }
        if (!lock.tryLock()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A synchronization is already running.");
        }
        SyncHistory h = new SyncHistory();
        h.setType(type);
        h.setTriggeredBy(triggeredBy);
        h.setStartedAt(LocalDateTime.now());
        h = history.save(h);
        try {
            Set<String> owners = new LinkedHashSet<>();
            for (String o : configuredOwners.split(",")) if (!o.isBlank()) owners.add(o.trim());
            owners.addAll(repos.findDistinctOwners());
            if (extraOwner != null && !extraOwner.isBlank()) owners.add(extraOwner.trim());

            int found = 0, created = 0, updated = 0;
            List<String> errors = new ArrayList<>();
            for (String owner : owners) {
                try {
                    for (GithubRepoDto dto : github.fetchRepos(owner)) {
                        found++;
                        int r = upsert(dto);
                        if (r == 1) created++; else if (r == 2) updated++;
                    }
                } catch (Exception e) {
                    log.warn("GitHub sync failed for {}: {}", owner, e.getMessage());
                    errors.add(owner + ": " + shortMessage(e));
                }
            }
            int apiDocs = refreshApiDocs(errors);

            h.setReposFound(found);
            h.setServicesCreated(created);
            h.setServicesUpdated(updated);
            h.setDocsRefreshed(apiDocs);
            h.setStatus(errors.isEmpty() ? Enums.SyncStatus.SUCCESS
                    : (found > 0 ? Enums.SyncStatus.PARTIAL : Enums.SyncStatus.FAILED));
            String summary = String.format("%d repositories scanned, %d services created, %d updated, %d API docs refreshed.",
                    found, created, updated, apiDocs);
            h.setMessage(cut(errors.isEmpty() ? summary : summary + " Issues: " + String.join("; ", errors)));
        } catch (Exception e) {
            log.error("Sync crashed", e);
            h.setStatus(Enums.SyncStatus.FAILED);
            h.setMessage(cut(shortMessage(e)));
        } finally {
            h.setFinishedAt(LocalDateTime.now());
            h = history.save(h);
            lock.unlock();
        }
        return h;
    }

    /** @return 0 = nothing to do, 1 = service created, 2 = service updated */
    private int upsert(GithubRepoDto d) {
        GithubRepo r = repos.findByGithubId(d.id()).orElseGet(GithubRepo::new);
        boolean isNew = r.getId() == null;
        LocalDateTime updatedAt = parse(d.updatedAt());
        boolean changed = isNew || !Objects.equals(r.getLastUpdated(), updatedAt)
                || !Objects.equals(r.getDescription(), d.description());

        r.setGithubId(d.id());
        r.setName(d.name());
        r.setFullName(d.fullName());
        r.setDescription(d.description());
        r.setOwner(d.owner() != null ? d.owner().login() : null);
        r.setLanguage(d.language());
        r.setUrl(d.htmlUrl());
        r.setStars(d.stars());
        r.setArchived(d.archived());
        r.setLastUpdated(updatedAt);
        r = repos.save(r);

        Optional<SoftwareService> existing = services.findByGithubRepoId(d.id());
        SoftwareService s;
        int result;
        if (existing.isPresent()) {
            if (!changed) return 0;
            s = existing.get();
            result = 2;
        } else if (autoCreate) {
            s = new SoftwareService();
            s.setName(uniqueName(d));
            s.setSource(Enums.ServiceSource.GITHUB);
            s.setGithubRepoId(d.id());
            s.setCreatedAt(LocalDateTime.now());
            result = 1;
        } else {
            return 0;
        }
        applyRepoToService(s, r);
        s = services.save(s);
        r.setServiceLinked(true);
        repos.save(r);
        refreshReadme(s, r);
        return result;
    }

    /** Copies repository metadata onto a service. Also used when a user imports a repo manually. */
    public void applyRepoToService(SoftwareService s, GithubRepo r) {
        s.setDescription(r.getDescription());
        s.setOwner(r.getOwner());
        s.setLanguage(r.getLanguage());
        s.setRepoUrl(r.getUrl());
        s.setLastUpdated(r.getLastUpdated() != null ? r.getLastUpdated() : LocalDateTime.now());
        boolean stale = r.getLastUpdated() != null && r.getLastUpdated().isBefore(LocalDateTime.now().minusDays(inactiveDays));
        s.setStatus(r.isArchived() || stale ? Enums.ServiceStatus.INACTIVE : Enums.ServiceStatus.ACTIVE);
    }

    public void refreshReadme(SoftwareService s, GithubRepo r) {
        try {
            String md = github.fetchReadme(r.getFullName());
            if (md == null || md.isBlank()) return;
            Documentation doc = docs.findFirstByServiceIdAndType(s.getId(), Enums.DocType.README).orElseGet(Documentation::new);
            doc.setService(s);
            doc.setType(Enums.DocType.README);
            doc.setTitle(s.getName() + " README");
            doc.setContent(md);
            doc.setSourceUrl(r.getUrl());
            doc.setUpdatedAt(LocalDateTime.now());
            docs.save(doc);
        } catch (Exception e) {
            log.debug("No README for {}: {}", r.getFullName(), e.getMessage());
        }
    }

    /** Re-downloads the API specification of every service that has an API documentation URL. */
    private int refreshApiDocs(List<String> errors) {
        int count = 0;
        for (SoftwareService s : services.findByApiDocUrlIsNotNull()) {
            if (s.getApiDocUrl().isBlank()) continue;
            try {
                String body = github.fetchUrl(s.getApiDocUrl());
                if (body == null || body.isBlank()) continue;
                Documentation doc = docs.findFirstByServiceIdAndType(s.getId(), Enums.DocType.API).orElseGet(Documentation::new);
                if (doc.getId() != null && body.equals(doc.getContent())) continue;
                doc.setService(s);
                doc.setType(Enums.DocType.API);
                doc.setTitle(s.getName() + " API specification");
                doc.setContent(body);
                doc.setSourceUrl(s.getApiDocUrl());
                doc.setUpdatedAt(LocalDateTime.now());
                docs.save(doc);
                count++;
            } catch (Exception e) {
                errors.add("API docs for " + s.getName() + ": " + shortMessage(e));
            }
        }
        return count;
    }

    private String uniqueName(GithubRepoDto d) {
        if (!services.existsByName(d.name())) return d.name();
        if (d.fullName() != null && !services.existsByName(d.fullName())) return d.fullName();
        return d.name() + "-" + d.id();
    }

    private LocalDateTime parse(String iso) {
        if (iso == null) return null;
        return OffsetDateTime.parse(iso).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }

    private String shortMessage(Exception e) {
        String m = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
        return m.length() > 200 ? m.substring(0, 200) : m;
    }

    private String cut(String s) {
        return s.length() > 2000 ? s.substring(0, 2000) : s;
    }
}
