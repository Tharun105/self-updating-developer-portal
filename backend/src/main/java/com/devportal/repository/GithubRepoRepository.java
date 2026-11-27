package com.devportal.repository;

import com.devportal.model.GithubRepo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GithubRepoRepository extends JpaRepository<GithubRepo, Long> {

    Optional<GithubRepo> findByGithubId(Long githubId);

    @Query("""
            select r from GithubRepo r
            where lower(r.name) like lower(concat('%', :q, '%'))
               or lower(r.owner) like lower(concat('%', :q, '%'))
               or lower(coalesce(r.language, '')) like lower(concat('%', :q, '%'))
            order by r.lastUpdated desc
            """)
    List<GithubRepo> search(@Param("q") String q);

    @Query("select distinct r.owner from GithubRepo r")
    List<String> findDistinctOwners();
}
