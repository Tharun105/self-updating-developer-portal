package com.devportal.repository;

import com.devportal.model.Documentation;
import com.devportal.model.Enums;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DocumentationRepository extends JpaRepository<Documentation, Long> {

    List<Documentation> findByServiceIdOrderByUpdatedAtDesc(Long serviceId);

    Optional<Documentation> findFirstByServiceIdAndType(Long serviceId, Enums.DocType type);

    @Query("""
            select d from Documentation d
            where lower(d.title) like lower(concat('%', :q, '%'))
               or lower(d.service.name) like lower(concat('%', :q, '%'))
            order by d.updatedAt desc
            """)
    List<Documentation> search(@Param("q") String q);

    @Modifying
    @Query("delete from Documentation d where d.service.id = :serviceId")
    void deleteByServiceId(@Param("serviceId") Long serviceId);
}
