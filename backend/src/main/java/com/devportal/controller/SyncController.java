package com.devportal.controller;

import com.devportal.model.Enums;
import com.devportal.model.SyncHistory;
import com.devportal.repository.SyncHistoryRepository;
import com.devportal.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {
    private final SyncService sync;
    private final SyncHistoryRepository history;

    /** Manual synchronisation. Optional {@code owner} adds a GitHub user/org to discover. */
    @PostMapping("/manual")
    public SyncHistory manual(@RequestParam(required = false) String owner, Authentication auth) {
        return sync.run(Enums.SyncType.MANUAL, auth.getName(), owner);
    }

    @GetMapping("/history")
    public List<SyncHistory> history(@RequestParam(defaultValue = "20") int limit) {
        return history.findAllByOrderByStartedAtDesc(PageRequest.of(0, Math.max(1, Math.min(limit, 100))));
    }
}
