package com.devportal;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class DeveloperPortalApplication {

    public static void main(String[] args) {
        SpringApplication.run(DeveloperPortalApplication.class, args);
    }

    /** All timestamps are stored in UTC so GitHub dates and server dates are comparable. */
    @PostConstruct
    void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }
}
