package com.example.demo.service.impl;

import com.example.demo.dto.MessageResponse;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.VerifyOtpRequest;
import com.example.demo.dto.ForgotPasswordRequest;
import com.example.demo.dto.ResetPasswordRequest;
import com.example.demo.dto.GoogleLoginRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtService;
import com.example.demo.service.AuthService;
import com.example.demo.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Objects;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Value("${google.client.id}")
    private String googleClientId;

    @Override
    public MessageResponse register(RegisterRequest request) {
        // 1. Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Error: Email is already registered!");
        }

        // 2. Tạo OTP ngẫu nhiên (6 số)
        String otp = String.format("%06d", new Random().nextInt(999999));
        System.out.println(">>> [DEBUG] OTP generation for " + request.getEmail() + ": " + otp + " <<<");

        // 3. Tạo User mới
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) 
                .role("USER")
                .isActive(true)
                .isVerified(false) // Chưa xác thực OTP
                .otpCode(otp)
                .otpExpiry(LocalDateTime.now().plusMinutes(5)) // OTP có hạn 5 phút
                .build();

        userRepository.save(user);

        // Send OTP via email
        emailService.sendOtpEmail(user.getEmail(), otp);

        return new MessageResponse("User registered successfully. Please check your email for OTP.");
    }

    @Override
    public MessageResponse verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Error: User not found!"));

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            return new MessageResponse("Account already verified.");
        }

        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Error: OTP has expired!");
        }

        if (!Objects.equals(user.getOtpCode(), request.getOtp())) {
            throw new RuntimeException("Error: OTP is invalid!");
        }

        user.setIsVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return new MessageResponse("OTP verified successfully.");
    }

    @Override
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Error: User with this email not found!"));

        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), otp);

        return new MessageResponse("An OTP has been sent to your email.");
    }

    @Override
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Error: User not found!"));

        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Error: OTP has expired!");
        }

        if (!Objects.equals(user.getOtpCode(), request.getOtp())) {
            throw new RuntimeException("Error: OTP is invalid!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return new MessageResponse("Password has been reset successfully.");
    }

    @Override
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();

                com.example.demo.entity.User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    user = new com.example.demo.entity.User();
                    user.setEmail(email);
                    user.setPassword(passwordEncoder.encode("GOOGLE_LOGIN_" + new Random().nextInt(1000000)));
                    user.setIsActive(true);
                    user.setIsVerified(true);
                    user.setRole("USER");
                    userRepository.save(user);
                }

                String jwtToken = jwtService.generateToken(user);
                return AuthResponse.builder()
                        .token(jwtToken)
                        .role(user.getRole())
                        .message("Google login successful")
                        .build();
            } else {
                throw new RuntimeException("Invalid Google ID token.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Google authentication failed: " + e.getMessage());
        }
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new RuntimeException("Account is not verified. Please verify your OTP.");
        }

        String jwtToken = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(jwtToken)
                .role(user.getRole())
                .message("Login successful")
                .build();
    }
}
