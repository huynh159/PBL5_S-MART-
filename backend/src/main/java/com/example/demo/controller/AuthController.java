package com.example.demo.controller;

import com.example.demo.dto.MessageResponse;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.VerifyOtpRequest;
import com.example.demo.dto.ForgotPasswordRequest;
import com.example.demo.dto.ResetPasswordRequest;
import com.example.demo.dto.GoogleLoginRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.demo.repository.UserRepository;
import com.example.demo.entity.User;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository; // Added for testing

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@RequestBody RegisterRequest request) {
        try {
            MessageResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<MessageResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        try {
            MessageResponse response = authService.verifyOtp(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            MessageResponse response = authService.forgotPassword(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            MessageResponse response = authService.resetPassword(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            AuthResponse response = authService.googleLogin(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    // Temporary API for testing to get the OTP directly
    @GetMapping("/test-otp")
    public ResponseEntity<String> getOtpForTesting(@RequestParam String email) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent() && user.get().getOtpCode() != null) {
            return ResponseEntity.ok(user.get().getOtpCode());
        }
        return ResponseEntity.badRequest().body("OTP không tồn tại");
    }
}
