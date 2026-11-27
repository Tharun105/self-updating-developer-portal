package com.devportal.service;

import com.devportal.dto.Dtos.UserRequest;
import com.devportal.model.Enums;
import com.devportal.model.User;
import com.devportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public List<User> all() {
        return users.findAll(Sort.by("id"));
    }

    public User create(UserRequest r) {
        if (r.password() == null || r.password().length() < 6) {
            throw bad("Password must be at least 6 characters.");
        }
        if (users.existsByUsername(r.username())) throw conflict("Username is already taken.");
        if (users.existsByEmail(r.email())) throw conflict("Email is already registered.");
        User u = new User();
        fill(u, r);
        u.setPassword(encoder.encode(r.password()));
        return users.save(u);
    }

    public User update(Long id, UserRequest r, String currentUsername) {
        User u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        users.findByUsername(r.username()).filter(o -> !o.getId().equals(id))
                .ifPresent(o -> { throw conflict("Username is already taken."); });
        if (users.findAll().stream().anyMatch(o -> !o.getId().equals(id) && o.getEmail().equalsIgnoreCase(r.email()))) {
            throw conflict("Email is already registered.");
        }
        if (u.getUsername().equals(currentUsername) && (r.role() != Enums.Role.ADMIN || !r.enabled())) {
            throw bad("You cannot remove your own admin access or disable your own account.");
        }
        fill(u, r);
        if (r.password() != null && !r.password().isBlank()) {
            if (r.password().length() < 6) throw bad("Password must be at least 6 characters.");
            u.setPassword(encoder.encode(r.password()));
        }
        return users.save(u);
    }

    public void delete(Long id, String currentUsername) {
        User u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
        if (u.getUsername().equals(currentUsername)) throw bad("You cannot delete your own account.");
        users.delete(u);
    }

    private void fill(User u, UserRequest r) {
        u.setUsername(r.username().trim());
        u.setEmail(r.email().trim());
        u.setRole(r.role());
        u.setEnabled(r.enabled());
    }

    private ResponseStatusException bad(String m) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, m); }
    private ResponseStatusException conflict(String m) { return new ResponseStatusException(HttpStatus.CONFLICT, m); }
}
