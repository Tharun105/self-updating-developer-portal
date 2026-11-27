package com.devportal.service;

import com.devportal.dto.GithubRepoDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/** Thin wrapper around the GitHub REST API. */
@Component
public class GitHubClient {
    private static final int MAX_TEXT = 50_000;
    private final RestClient github;
    private final RestClient plain = RestClient.create();
    private final int maxRepos;

    public GitHubClient(@Value("${github.api-url}") String baseUrl,
                        @Value("${github.token:}") String token,
                        @Value("${github.max-repos-per-owner:50}") int maxRepos) {
        RestClient.Builder b = RestClient.builder().baseUrl(baseUrl)
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28");
        if (token != null && !token.isBlank()) b.defaultHeader("Authorization", "Bearer " + token);
        this.github = b.build();
        this.maxRepos = Math.min(Math.max(maxRepos, 1), 100);
    }

    /** Public repositories of a GitHub user or organisation, most recently updated first. */
    public List<GithubRepoDto> fetchRepos(String owner) {
        GithubRepoDto[] repos = github.get()
                .uri("/users/{owner}/repos?per_page={n}&sort=updated", owner, maxRepos)
                .accept(MediaType.parseMediaType("application/vnd.github+json"))
                .retrieve()
                .body(GithubRepoDto[].class);
        return repos == null ? Collections.emptyList() : Arrays.asList(repos);
    }

    /** README as raw text, or null when the repository has none. */
    public String fetchReadme(String fullName) {
        String text = github.get()
                .uri("/repos/{full}/readme", fullName)
                .accept(MediaType.parseMediaType("application/vnd.github.raw+json"))
                .retrieve()
                .body(String.class);
        return truncate(text);
    }

    /** Downloads an API specification (OpenAPI/Swagger JSON or YAML) from a public http(s) URL. */
    public String fetchUrl(String url) {
        URI uri = URI.create(url);
        if (uri.getScheme() == null || !(uri.getScheme().equals("http") || uri.getScheme().equals("https"))) {
            throw new IllegalArgumentException("Only http(s) URLs are supported");
        }
        return truncate(plain.get().uri(uri).retrieve().body(String.class));
    }

    private String truncate(String s) {
        return s != null && s.length() > MAX_TEXT ? s.substring(0, MAX_TEXT) : s;
    }
}
