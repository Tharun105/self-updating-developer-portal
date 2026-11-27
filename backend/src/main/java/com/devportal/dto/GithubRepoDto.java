package com.devportal.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Subset of the GitHub "repository" payload we care about. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GithubRepoDto(
        long id,
        String name,
        @JsonProperty("full_name") String fullName,
        String description,
        @JsonProperty("html_url") String htmlUrl,
        String language,
        @JsonProperty("stargazers_count") int stars,
        @JsonProperty("updated_at") String updatedAt,
        boolean archived,
        Owner owner) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Owner(String login) {}
}
