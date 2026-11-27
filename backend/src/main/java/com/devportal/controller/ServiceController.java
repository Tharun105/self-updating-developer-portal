package com.devportal.controller;

import com.devportal.dto.Dtos.ServiceRequest;
import com.devportal.model.Enums;
import com.devportal.model.SoftwareService;
import com.devportal.service.CatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {
    private final CatalogService catalog;

    @GetMapping
    public Page<SoftwareService> list(@RequestParam(required = false) String q,
                                      @RequestParam(required = false) Enums.ServiceStatus status,
                                      @RequestParam(required = false) String language,
                                      @PageableDefault(size = 10, sort = "lastUpdated", direction = Sort.Direction.DESC) Pageable pageable) {
        return catalog.search(q, status, language, pageable);
    }

    @GetMapping("/languages")
    public List<String> languages() {
        return catalog.languages();
    }

    @GetMapping("/{id}")
    public SoftwareService get(@PathVariable Long id) {
        return catalog.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SoftwareService create(@Valid @RequestBody ServiceRequest r) {
        return catalog.create(r);
    }

    @PutMapping("/{id}")
    public SoftwareService update(@PathVariable Long id, @Valid @RequestBody ServiceRequest r) {
        return catalog.update(id, r);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        catalog.delete(id);
    }
}
