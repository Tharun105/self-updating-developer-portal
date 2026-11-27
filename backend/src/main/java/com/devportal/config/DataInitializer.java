package com.devportal.config;

import com.devportal.model.*;
import com.devportal.repository.DocumentationRepository;
import com.devportal.repository.SoftwareServiceRepository;
import com.devportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Seeds demo accounts and a few sample services on first start. */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final UserRepository users;
    private final SoftwareServiceRepository services;
    private final DocumentationRepository docs;
    private final PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        if (users.count() == 0) {
            user("admin", "admin@devportal.local", "admin123", Enums.Role.ADMIN);
            user("developer", "developer@devportal.local", "dev123", Enums.Role.DEVELOPER);
            user("viewer", "viewer@devportal.local", "view123", Enums.Role.VIEWER);
        }
        if (services.count() == 0) {
            SoftwareService auth = service("auth-service", "Issues and validates JWT tokens for all internal APIs.", "Platform Team", "Java", "2.3.1");
            service("payment-api", "Handles checkout, refunds and payment provider webhooks.", "Payments Team", "JavaScript", "1.8.0");
            service("notification-worker", "Sends email and SMS notifications from the event queue.", "Platform Team", "Python", "0.9.4");
            Documentation d = new Documentation();
            d.setService(auth);
            d.setTitle("Getting started with auth-service");
            d.setType(Enums.DocType.GUIDE);
            d.setContent("POST /api/auth/login with username and password to receive a bearer token.\n\nSend the token in the Authorization header on every request.");
            docs.save(d);
        }
    }

    private void user(String username, String email, String password, Enums.Role role) {
        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword(encoder.encode(password));
        u.setRole(role);
        users.save(u);
    }

    private SoftwareService service(String name, String desc, String owner, String lang, String version) {
        SoftwareService s = new SoftwareService();
        s.setName(name);
        s.setDescription(desc);
        s.setOwner(owner);
        s.setLanguage(lang);
        s.setVersion(version);
        return services.save(s);
    }
}
