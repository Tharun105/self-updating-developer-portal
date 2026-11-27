package com.devportal.controller;

import com.devportal.model.GithubRepo;
import com.devportal.model.SoftwareService;
import com.devportal.repository.GithubRepoRepository;
import com.devportal.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/github")
@RequiredArgsConstructor
public class GithubController {
    private final GithubRepoRepository repos;
    private final CatalogService catalog;

    /** Repositories discovered so far (filled by synchronisation). */
    @GetMapping("/repos")
    public List<GithubRepo> repos(@RequestParam(defaultValue = "") String q) {
        return repos.search(q.trim());
    }

    @PostMapping("/repos/{id}/import")
    @ResponseStatus(HttpStatus.CREATED)
    public SoftwareService importRepo(@PathVariable Long id) {
        return catalog.importRepo(id);
    }
}
