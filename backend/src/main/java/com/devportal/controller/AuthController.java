package com.devportal.controller;

import com.devportal.dto.Dtos.*;
import com.devportal.model.Enums;
import com.devportal.model.User;
import com.devportal.repository.UserRepository;
import com.devportal.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authManager;
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest r) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(r.username(), r.password()));
        User u = users.findByUsername(r.username()).orElseThrow();
        return response(u, true);
    }

    /** Self-registration always creates a read-only VIEWER; an admin can promote the account. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest r) {
        if (users.existsByUsername(r.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken.");
        }
        if (users.existsByEmail(r.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered.");
        }
        User u = new User();
        u.setUsername(r.username().trim());
        u.setEmail(r.email().trim());
        u.setPassword(encoder.encode(r.password()));
        u.setRole(Enums.Role.VIEWER);
        return response(users.save(u), true);
    }

    @GetMapping("/me")
    public AuthResponse me(Authentication auth) {
        return response(users.findByUsername(auth.getName()).orElseThrow(), false);
    }

    private AuthResponse response(User u, boolean withToken) {
        return new AuthResponse(withToken ? jwt.generate(u) : null, u.getId(), u.getUsername(), u.getEmail(), u.getRole().name());
    }
}
