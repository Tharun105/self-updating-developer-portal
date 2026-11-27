package com.devportal.service;

import com.devportal.model.Enums;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Runs the metadata synchronisation automatically (see sync.cron in application.properties). */
@Component
@RequiredArgsConstructor
@Slf4j
public class SyncScheduler {
    private final SyncService syncService;

    @Value("${sync.enabled:true}")
    private boolean enabled;

    @Scheduled(cron = "${sync.cron:0 0 * * * *}")
    public void scheduledSync() {
        if (!enabled) return;
        try {
            var h = syncService.run(Enums.SyncType.SCHEDULED, "scheduler", null);
            log.info("Scheduled sync finished: {} - {}", h.getStatus(), h.getMessage());
        } catch (Exception e) {
            log.warn("Scheduled sync skipped: {}", e.getMessage());
        }
    }
}
