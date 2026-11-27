package com.devportal.service;

import com.devportal.dto.Dtos.DocRequest;
import com.devportal.dto.Dtos.DocSummary;
import com.devportal.model.Documentation;
import com.devportal.repository.DocumentationRepository;
import com.devportal.repository.SoftwareServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentationService {
    private final DocumentationRepository docs;
    private final SoftwareServiceRepository services;

    public List<DocSummary> list(String q, Long serviceId) {
        List<Documentation> found = serviceId != null
                ? docs.findByServiceIdOrderByUpdatedAtDesc(serviceId)
                : docs.search(q == null ? "" : q.trim());
        return found.stream().map(d -> new DocSummary(d.getId(), d.getTitle(), d.getType(),
                d.getService().getId(), d.getService().getName(), d.getSourceUrl(), d.getUpdatedAt())).toList();
    }

    public Documentation get(Long id) {
        return docs.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found."));
    }

    public Documentation create(DocRequest r) {
        return docs.save(apply(new Documentation(), r));
    }

    public Documentation update(Long id, DocRequest r) {
        return docs.save(apply(get(id), r));
    }

    public void delete(Long id) {
        docs.delete(get(id));
    }

    private Documentation apply(Documentation d, DocRequest r) {
        d.setService(services.findById(r.serviceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected service does not exist.")));
        d.setTitle(r.title().trim());
        d.setContent(r.content());
        d.setType(r.type());
        d.setSourceUrl(r.sourceUrl() == null || r.sourceUrl().isBlank() ? null : r.sourceUrl().trim());
        d.setUpdatedAt(LocalDateTime.now());
        return d;
    }
}
