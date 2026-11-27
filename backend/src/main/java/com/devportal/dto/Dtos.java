package com.devportal.dto;

import com.devportal.model.*;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class Dtos {
    private Dtos() {}

    public record LoginRequest(@NotBlank(message = "Username is required") String username,
                               @NotBlank(message = "Password is required") String password) {}

    public record RegisterRequest(
            @NotBlank(message = "Username is required") @Size(min = 3, max = 50, message = "Username must be 3-50 characters") String username,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") String email,
            @NotBlank(message = "Password is required") @Size(min = 6, max = 100, message = "Password must be at least 6 characters") String password) {}

    public record AuthResponse(String token, Long id, String username, String email, String role) {}

    public record ServiceRequest(
            @NotBlank(message = "Name is required") @Size(max = 150) String name,
            @Size(max = 1000) String description,
            @Size(max = 100) String owner,
            @Size(max = 50) String language,
            @Size(max = 500) @Pattern(regexp = "^$|^https?://.+", message = "Must be an http(s) URL") String repoUrl,
            @Size(max = 500) @Pattern(regexp = "^$|^https?://.+", message = "Must be an http(s) URL") String apiDocUrl,
            @Size(max = 30) String version,
            @NotNull(message = "Status is required") Enums.ServiceStatus status) {}

    public record UserRequest(
            @NotBlank(message = "Username is required") @Size(min = 3, max = 50) String username,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") String email,
            @Size(max = 100) String password,
            @NotNull(message = "Role is required") Enums.Role role,
            boolean enabled) {}

    public record DocRequest(
            @NotBlank(message = "Title is required") @Size(max = 200) String title,
            String content,
            @NotNull(message = "Type is required") Enums.DocType type,
            @Size(max = 500) String sourceUrl,
            @NotNull(message = "Service is required") Long serviceId) {}

    public record DocSummary(Long id, String title, Enums.DocType type, Long serviceId, String serviceName,
                             String sourceUrl, LocalDateTime updatedAt) {}

    public record DashboardStats(long totalServices, long activeServices, long inactiveServices,
                                 long discoveredRepositories, long totalDocuments,
                                 List<SoftwareService> recentServices, List<SyncHistory> syncHistory,
                                 Map<String, Long> languages, SyncHistory lastSync) {}
}
