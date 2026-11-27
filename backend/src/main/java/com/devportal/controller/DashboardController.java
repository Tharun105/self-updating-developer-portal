package com.devportal.controller;

import com.devportal.dto.Dtos.DashboardStats;
import com.devportal.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboard;

    @GetMapping("/dashboard/stats")
    public DashboardStats stats() {
        return dashboard.stats();
    }

    @GetMapping("/admin/overview")
    public Map<String, Object> adminOverview() {
        return dashboard.adminOverview();
    }
}
