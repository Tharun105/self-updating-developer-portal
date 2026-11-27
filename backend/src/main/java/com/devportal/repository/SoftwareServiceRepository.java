package com.devportal.repository;

import com.devportal.model.Enums;
import com.devportal.model.SoftwareService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SoftwareServiceRepository
        extends JpaRepository<SoftwareService, Long>, JpaSpecificationExecutor<SoftwareService> {

    Optional<SoftwareService> findByGithubRepoId(Long githubRepoId);
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long id);
    long countByStatus(Enums.ServiceStatus status);
    List<SoftwareService> findTop5ByOrderByLastUpdatedDesc();
    List<SoftwareService> findByApiDocUrlIsNotNull();

    @Query("select distinct s.language from SoftwareService s where s.language is not null order by s.language")
    List<String> findLanguages();

    @Query("select s.language, count(s) from SoftwareService s group by s.language")
    List<Object[]> languageCounts();
}
