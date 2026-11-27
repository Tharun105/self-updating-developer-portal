package com.devportal.controller;

import com.devportal.dto.Dtos.DocRequest;
import com.devportal.dto.Dtos.DocSummary;
import com.devportal.model.Documentation;
import com.devportal.service.DocumentationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/docs")
@RequiredArgsConstructor
public class DocumentationController {
    private final DocumentationService docs;

    @GetMapping
    public List<DocSummary> list(@RequestParam(required = false) String q,
                                 @RequestParam(required = false) Long serviceId) {
        return docs.list(q, serviceId);
    }

    @GetMapping("/{id}")
    public Documentation get(@PathVariable Long id) {
        return docs.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Documentation create(@Valid @RequestBody DocRequest r) {
        return docs.create(r);
    }

    @PutMapping("/{id}")
    public Documentation update(@PathVariable Long id, @Valid @RequestBody DocRequest r) {
        return docs.update(id, r);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        docs.delete(id);
    }
}
